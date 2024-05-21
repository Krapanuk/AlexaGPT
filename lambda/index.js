const Alexa = require('ask-sdk-core');
const { Configuration, OpenAIApi } = require('openai');
const keys = require('./Keys');  // Stelle sicher, dass du deinen OpenAI-API-Schlüssel in dieser Datei gespeichert hast

const config = new Configuration({
    apiKey: keys.OPEN_AI_KEY
});

const openai = new OpenAIApi(config);

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Willkommen bei Olli GPT. Du kannst eine Frage stellen!';
        console.log('LaunchRequestHandler ausgelöst');
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    async handle(handlerInput) {
        const defaultPrompt = "Hi! Leider habe ich Deine Frage nicht verstanden";
        let speakOutput = 'Es gab ein Problem bei der Kommunikation mit ChatGPT. Bitte versuche es erneut.';

        try {
            console.log(`Sending prompt to ChatGPT: ${defaultPrompt}`);
            const response = await openai.createChatCompletion({
                model: "gpt-4o",
                messages: [
                    {
                        "role": "system",
                        "content": "Du bist mein freundlicher persoenlicher Assistent, der mir alle meine Fragen beantwortet."
                    },
                    {
                        "role": "user",
                        "content": defaultPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 64,
                top_p: 1,
            });

            console.log(`Received response from ChatGPT: ${JSON.stringify(response.data)}`);

            if (response && response.data && response.data.choices && response.data.choices.length > 0) {
                speakOutput = response.data.choices[0].message.content.trim();
            } else {
                console.error('Keine gültige Antwort von ChatGPT erhalten.');
            }
        } catch (error) {
            console.error('Fehler bei der Kommunikation mit der OpenAI-API:', error);
        }

        console.log(`Antwort an Benutzer: ${speakOutput}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
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
        let speakOutput = 'Es gab ein Problem bei der Kommunikation mit ChatGPT. Bitte versuche es erneut.';

        try {
            console.log(`User question: ${question}`);
            const response = await openai.createChatCompletion({
                model: "gpt-4o",
                messages: [
                    {
                        "role": "system",
                        "content": "Du bist mein freundlicher persoenlicher Assistent, der mir alle meine Fragen, kurz und knapp in maximal 5 Saetzen, beantwortet."
                    },
                    {
                        "role": "user",
                        "content": question
                    }
                ],
                temperature: 0.7,
                max_tokens: 150,
                top_p: 1,
            });

            console.log(`Received response from ChatGPT: ${JSON.stringify(response.data)}`);

            if (response && response.data && response.data.choices && response.data.choices.length > 0) {
                speakOutput = response.data.choices[0].message.content.trim();
            } else {
                console.error('Keine gültige Antwort von ChatGPT erhalten.');
            }
        } catch (error) {
            console.error('Fehler bei der Kommunikation mit der OpenAI-API:', error);
        }

        console.log(`Antwort an Benutzer: ${speakOutput}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Du kannst Hallo sagen oder eine Frage stellen, um eine Antwort zu erhalten.';
        console.log('HelpIntentHandler ausgelöst');
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
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
        console.log('FallbackIntentHandler ausgelöst');
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        if (handlerInput.requestEnvelope.request.error) {
            console.log(`~~~~ Error: ${JSON.stringify(handlerInput.requestEnvelope.request.error)}`);
        }
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
        console.log('IntentReflectorHandler ausgelöst');
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Entschuldigung, es gab ein Problem bei der Ausführung deiner Anfrage. Bitte versuche es erneut.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        AskQuestionIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();