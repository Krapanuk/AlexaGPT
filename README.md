# AlexaGPT
Build your own local Alexa-Skill answering your questions via ChatGPT.

## Prerequisites
You'll need:
- At least one Alexa-Device like Echo Dot, Echo Show,
- an Amazon developer account: https://developer.amazon.com and, last but not least
- an OpenAI API-Key.

## Creating your skill
Just follow these steps to create your skill:
- Login to https://developer.amazon.com/alexa/console/ask and
- go to "Create Skill"

### Skill basics
- Name, Locale:
  - Enter a Skill name (the name of your skill, e. g. shown in Echo Show's display when your skill is opened) and
  - your skill's primary locale, e. g. English (US)
  - => click "Next"
- Experience, Model, Hosting service: Choose as
  - type of experience: Other,
  - model: Custom,
  - hosting service: Alexa-hosted (Node.js) and hosting region like US East (N. Virginia)
  - => click "Next"
- Templates: Start from Scratch
- => click "Next"

Now your skills basic template will be created (that will take about 1 minute).

### Configuration
- Invocations:
  - Skill Invocation Name: Set your Skills invocation name (The name you have to speak to open your skill: 'Alexa, open ...')
- Interaction Model:
  - Intents:
    - JSON Editor: Just copy&paste the code from the sample
      - for English language version: \interactionModels\custom\en-US.json
      - for German language version: \interactionModels\custom\de-DE.json

### Code
Now go to "Code" in the top menu bar. Just 
- open your \lambda\index.js
- copy&paste the code from AlexaGPT\lambda\index.js into your \lambda\index.js
- save and
- create a new file \lambda\Key.js and
- copy the code from AlexaGPT\lambda\Key.js
- adding your OpenAI API-Key
- and save this changes, too.

Clicking "Deploy" your new Skill will be deployed, ready to test on your own Alexa-Device(s) within a few seconds.

