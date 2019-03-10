const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');
const { ActivityTypes, CardFactory } = require('botbuilder');

const PROFILE_DIALOG = 'profileDialog';
const {YellowCard} = require('./../yellowCake');

class TriangleGreeting extends ComponentDialog {
    constructor(dialogId, userProfileAccessor) {
        super(dialogId);
        this.addDialog(new WaterfallDialog(PROFILE_DIALOG, [
            this.initializeStateStep.bind(this)
        ]))
    }

    async initializeStateStep(step) {
        await step.context.sendActivity(`You have selected  ${ userProfile.name } shape .Here is your cake!`);
        const ycard = CardFactory.adaptiveCard(YellowCard);
        await step.context.sendActivity({ attachments: [ycard] });
      //  await step.context.sendActivity(`You can always say 'My name is <your name> to reintroduce yourself to me.`);
        return await step.endDialog();
    }
}
exports.TriangleGreetingDialog = TriangleGreeting;