const Alexa = require('ask-sdk-core');
const { Configuration, OpenAIApi } = require('openai');
const axios = require('axios');
const key = require('./Key');

const config = new Configuration({
    apiKey: key.OPEN_AI_KEY
});

const openai = new OpenAIApi(config);

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Willkommen bei KI. Du kannst eine Frage stellen!';
        const repromptOutput = 'Bitte stelle eine Frage oder sage Stopp, um zu beenden.';
        // Initialisiere die Sitzungsattribute
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.conversationHistory = [{
            "role": "system",
            "content": "Bitte beantworte jede Frage kurz und in maximal 5 Sätzen. Wenn dir Informationen fehlen oder eine Internetsuche hilfreich sein könnte, sage 'Suche im Internet nach [Suchbegriff]'."
        }];
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptOutput)
            .getResponse();
    }
};

const AskQuestionIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskQuestionIntent';
    },
    async handle(handlerInput) {
        const question = handlerInput.requestEnvelope.request.intent.slots.question.value;
        let speakOutput = `Ich verarbeite deine Frage: ${question}. `;
        let searchCount = 0;
        const maxSearches = 3;
        let lastSearchTerm = '';

        async function performSearch(searchTerm) {
            try {
                const googleResponse = await axios.get('https://www.googleapis.com/customsearch/v1', {
                    params: {
                        key: key.GOOGLE_KEY,
                        cx: key.GOOGLE_CSE_ID,
                        q: searchTerm,
                    }
                });

                if (googleResponse.data.items && googleResponse.data.items.length > 0) {
                    return googleResponse.data.items.slice(0, 5).map((item) => {
                        return `${item.title}: ${item.snippet}`;
                    }).join(' ');
                }
            } catch (error) {
                console.error('Fehler bei der Internetsuche:', error);
            }
            return null;
        }

        async function getChatGPTResponse(messages) {
            const response = await openai.createChatCompletion({
                model: "gpt-4o",
                messages: messages,
                temperature: 0.7,
                max_tokens: 250,
                top_p: 1,
            });

            if (response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content.trim();
            }
            return null;
        }

        let messages = [
            { role: "system", content: `Du bist ein hilfreicher Assistent mit Internetzugang. Nutze proaktiv die Internetsuche, um aktuelle und präzise Informationen zu liefern. Wenn du eine Frage nicht sofort beantworten kannst, aktuelle Daten benötigst oder dir unsicher bist, führe automatisch eine Internetsuche durch, indem du 'Suche im Internet nach [Suchbegriff]' sagst. Verwende dabei den präzisesten Suchbegriff, der zur Beantwortung der Frage nötig ist. Wenn eine Suche keine Ergebnisse liefert oder die Ergebnisse unzureichend sind, formuliere automatisch eine verbesserte, spezifischere oder alternative Suchanfrage. Frage niemals den Benutzer, ob du eine Suche durchführen sollst - führe sie einfach durch. Behalte immer den Kontext der ursprünglichen Frage im Auge.` },
            { role: "user", content: question }
        ];

        try {
            while (searchCount < maxSearches) {
                const answer = await getChatGPTResponse(messages);
                
                if (!answer) {
                    speakOutput += 'Entschuldigung, ich konnte keine Antwort generieren. ';
                    break;
                }

                if (answer.toLowerCase().includes("suche im internet nach") || answer.toLowerCase().includes("soll ich diese suche durchführen")) {
                    const searchTermMatch = answer.match(/suche im internet nach (.+)/i) || [null, question];
                    if (searchTermMatch && searchTermMatch[1]) {
                        const searchTerm = searchTermMatch[1].trim();
                        
                        // Überprüfen, ob der Suchbegriff sich von der letzten Suche unterscheidet
                        if (searchTerm === lastSearchTerm) {
                            messages.push({ role: "assistant", content: `Die vorgeschlagene Suche nach "${searchTerm}" wurde bereits durchgeführt. Ich werde eine alternative Suchanfrage formulieren.` });
                            messages.push({ role: "user", content: `Bitte formuliere eine völlig neue, spezifischere oder alternative Suchanfrage, die sich von "${searchTerm}" unterscheidet, um die ursprüngliche Frage "${question}" zu beantworten.` });
                            continue;
                        }
                        
                        lastSearchTerm = searchTerm;
                        speakOutput += `Ich suche nach Informationen zu ${searchTerm}. `;

                        const searchResults = await performSearch(searchTerm);
                        searchCount++;

                        if (searchResults) {
                            messages.push({ role: "assistant", content: `Ich habe eine Suche nach "${searchTerm}" durchgeführt.` });
                            messages.push({ role: "user", content: `Hier sind die Suchergebnisse: ${searchResults}. Analysiere diese Informationen im Kontext der ursprünglichen Frage "${question}". Wenn die Informationen nicht ausreichen oder nicht direkt die Frage beantworten, formuliere automatisch eine spezifischere oder alternative Suchanfrage. Behalte immer den Kontext der ursprünglichen Frage im Auge.` });
                        } else {
                            speakOutput += `Ich konnte leider keine Informationen zu ${searchTerm} finden. `;
                            messages.push({ role: "assistant", content: `Ich konnte keine Informationen zu "${searchTerm}" finden. Ich werde einen anderen Ansatz versuchen.` });
                            messages.push({ role: "user", content: `Bitte formuliere eine völlig neue, spezifischere oder alternative Suchanfrage, die sich von "${searchTerm}" unterscheidet, um die ursprüngliche Frage "${question}" zu beantworten.` });
                        }
                    } else {
                        speakOutput += 'Ich konnte den Suchbegriff nicht verstehen. ';
                        break;
                    }
                } else {
                    speakOutput += answer;
                    break;
                }
            }

            if (searchCount >= maxSearches) {
                speakOutput += 'Ich habe mehrere Suchen durchgeführt. Hier ist meine beste Antwort basierend auf den gefundenen Informationen: ';
                const finalAnswer = await getChatGPTResponse([...messages, { role: "user", content: `Bitte gib eine abschließende Zusammenfassung und Antwort auf die ursprüngliche Frage: "${question}", basierend auf allen bisher gesammelten Informationen. Wenn du keine zufriedenstellende Antwort geben kannst, erkläre kurz, warum es schwierig war, die Frage zu beantworten.` }]);
                speakOutput += finalAnswer || "Entschuldigung, ich konnte keine zufriedenstellende Antwort finden.";
            }

        } catch (error) {
            speakOutput += `Es gab einen Fehler bei der Verarbeitung deiner Anfrage. Bitte versuche es noch einmal. `;
        }

        const repromptOutput = 'Möchtest du eine weitere Frage stellen?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Auf Wiedersehen!';
        console.log('CancelAndStopIntentHandler ausgelöst');
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Entschuldigung, das weiß ich nicht. Bitte versuche es erneut.';
        const repromptOutput = 'Bitte stelle eine Frage oder sage Stopp, um zu beenden.';
        console.log('FallbackIntentHandler ausgelöst');
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Delete session attributes
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.conversationHistory = [];
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder.getResponse();
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;
        const repromptOutput = 'Bitte stelle eine weitere Frage oder sage Stopp, um zu beenden.';
        console.log('IntentReflectorHandler ausgelöst');
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptOutput)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Entschuldigung, es gab ein Problem bei der Ausführung deiner Anfrage. Bitte versuche es erneut.';
        const repromptOutput = 'Bitte stelle eine Frage oder sage Stopp, um zu beenden.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptOutput)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        AskQuestionIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();