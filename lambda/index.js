const Alexa = require('ask-sdk-core');
const { Configuration, OpenAIApi } = require('openai');
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
        const speakOutput = 'Welcome to MyGPT. Say My question is, followed by your question, to ask me a question!';
        const repromptOutput = 'Please ask a question or say Stopp to end.';
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
        let speakOutput = 'There was a problem communicating to ChatGPT. Please try again.';
        const repromptOutput = 'Please ask a question or say Stopp to end.';

        try {
            const response = await openai.createChatCompletion({
                model: "gpt-4o",
                messages: [
                    {
                        "role": "system",
                        "content": "You are my friendly personal assistant, answering my question in a few words with less than 5 sentences."
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
            if (response && response.data && response.data.choices && response.data.choices.length > 0) {
                speakOutput = response.data.choices[0].message.content.trim();
            }
        } catch (error) {
            console.error('Error communicating with OpenAI-API:', error);
        }
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
        const speakOutput = 'Goodby!';
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
        const speakOutput = 'Sorry, I dont know that. Please try again.';
        const repromptOutput = 'Please ask a question or say Stopp to end.';
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
        return handlerInput.responseBuilder.getResponse(); // Notice we send an empty response
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;
        const repromptOutput = 'Please ask a question or say Stopp to end.';
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
        const speakOutput = 'Sorry, there was a problem executing your request. Please try again.';
        const repromptOutput = 'Please ask a question or say Stopp to end.';
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
