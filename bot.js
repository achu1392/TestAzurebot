// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// bot.js is your main bot dialog entry point for handling activity types

// Import required Bot Builder
const { ActivityTypes, CardFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const { UserProfile } = require('./dialogs/greeting/userProfile');
const { WelcomeCard } = require('./dialogs/welcome');
const { GreetingDialog } = require('./dialogs/greeting');
const {TriangleGreetingDialog} = require('./dialogs/trianglegreeting');
const {ColourCard} = require('./dialogs/colours');
// Greeting Dialog ID
const GREETING_DIALOG = 'greetingDialog';

// State Accessor Properties
const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_PROFILE_PROPERTY = 'userProfileProperty';

// LUIS service type entry as defined in the .bot file.
const LUIS_CONFIGURATION = 'BasicBotLuisApplication';
const {YellowCard} = require('./dialogs/yellow');
const {ToppingsCard} = require('./dialogs/toppings');
const {CandlesCard} = require('./dialogs/candles');
const {ToppingsWithNoShell} = require('./dialogs/ToppingsWithNoShells');
const {RoundYellowCreamCandle} = require('./dialogs/roundYellowCreamCandle');
const {RoundYellowRoseCandle} = require('./dialogs/RoundYellowRoseCandle');
const {RoundYellowRoseNoCandle} = require('./dialogs/RoundYellowRoseNoCandle');
const {RoundYellowShellCandle} = require('./dialogs/roundYellowShellCandle');
const {RoundYellowShellNoCandle} = require('./dialogs/roundYellowShellNoCandle');
const {RoundBrownCreamCandle} = require('./dialogs/roundBrownCreamWithCandle');
const {RoundBrownCreamNoCandle} = require('./dialogs/roundBrownCreamWithNoCandle');
const {RoundBrownShellCandle} = require('./dialogs/roundBrownShellsWithCandle');
const {RoundBrownShellNoCandle} = require('./dialogs/roundBrownShellsWithNoCandle');
const {RoundBrownCherryCandle} = require('./dialogs/roundBrownCherryWithCandle');
const {RoundBrownCherryNoCandle} = require('./dialogs/roundBrownCherryWithNoCandle');
const {RoundBrownRoseCandle} = require('./dialogs/roundBrownRoseWithCandle');
const {RoundBrownRoseNoCandle} = require('./dialogs/roundBrownRoseWithNoCandle');
const {RoundWhiteCreamCandle} = require('./dialogs/roundWhiteCreamWithCandle');
const {RoundWhiteCreamNoCandle} = require('./dialogs/roundWhiteCreamWithNoCandle');
const {RoundWhiteRoseCandle} = require('./dialogs/roundWhiteRoseWithCandle');
const {RoundWhiteRoseNoCandle} = require('./dialogs/roundWhiteRoseWithNoCandle');
const {RoundWhiteCherryCandle} = require('./dialogs/roundWhiteCherryWithNoCandle');
const {RoundBlueCreamWithCandle} = require('./dialogs/roundBlueCreamWithCandle');
const {RoundBlueCreamWithNoCandle} = require('./dialogs/roundBlueCreamWithNoCandle');
const {RoundBlueRoseWithCandle} = require('./dialogs/roundBlueRoseWithCandle');
const {RoundBlueShellWithCandle} = require('./dialogs/roundBlueShellsWithCandle');
const {RoundBlueCherryWithCandle} = require('./dialogs/roundBlueCherryWithCandle');

// Supported LUIS Intents.
const GREETING_INTENT = 'Greeting';
const CANCEL_INTENT = 'Cancel';
const HELP_INTENT = 'Help';
const NONE_INTENT = 'None';
const FRUIT_INTENT = 'Yellow';

// Supported LUIS Entities, defined in ./dialogs/greeting/resources/greeting.lu
const USER_NAME_ENTITIES = ['userName', 'userName_patternAny'];
const USER_LOCATION_ENTITIES = ['userLocation', 'userLocation_patternAny'];
var shape="";
var color ="";
var topping = "";
var candleCheck="";

/**
 * Demonstrates the following concepts:
 *  Displaying a Welcome Card, using Adaptive Card technology
 *  Use LUIS to model Greetings, Help, and Cancel interactions
 *  Use a Waterfall dialog to model multi-turn conversation flow
 *  Use custom prompts to validate user input
 *  Store conversation and user state
 *  Handle conversation interruptions
 */
class BasicBot {
    
    /**
     * Constructs the three pieces necessary for this bot to operate:
     * 1. StatePropertyAccessor for conversation state
     * 2. StatePropertyAccess for user state
     * 3. LUIS client
     * 4. DialogSet to handle our GreetingDialog
     *
     * @param {ConversationState} conversationState property accessor
     * @param {UserState} userState property accessor
     * @param {BotConfiguration} botConfig contents of the .bot file
     */
    constructor(conversationState, userState, botConfig) {
        if (!conversationState) throw new Error('Missing parameter.  conversationState is required');
        if (!userState) throw new Error('Missing parameter.  userState is required');
        if (!botConfig) throw new Error('Missing parameter.  botConfig is required');
        

        // Add the LUIS recognizer.
        const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
        if (!luisConfig || !luisConfig.appId) throw new Error('Missing LUIS configuration. Please follow README.MD to create required LUIS applications.\n\n');
        const luisEndpoint = luisConfig.region && luisConfig.region.indexOf('https://') === 0 ? luisConfig.region : luisConfig.getEndpoint();
        this.luisRecognizer = new LuisRecognizer({
            applicationId: luisConfig.appId,
            endpoint: luisEndpoint,
            // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
            endpointKey: luisConfig.authoringKey
        });

        // Create the property accessors for user and conversation state
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
        this.dialogState = conversationState.createProperty(DIALOG_STATE_PROPERTY);

        // Create top-level dialog(s)
        this.dialogs = new DialogSet(this.dialogState);
        // Add the Greeting dialog to the set
        this.dialogs.add(new GreetingDialog(GREETING_DIALOG, this.userProfileAccessor));
//this.dialogs.add(new TriangleGreetingDialog())
        this.conversationState = conversationState;
        this.userState = userState;
    }

    /**
     * Driver code that does one of the following:
     * 1. Display a welcome card upon receiving ConversationUpdate activity
     * 2. Use LUIS to recognize intents for incoming user message
     * 3. Start a greeting dialog
     * 4. Optionally handle Cancel or Help interruptions
     *
     * @param {Context} context turn context from the adapter
     */
    async onTurn(context) {
        // Handle Message activity type, which is the main activity type for shown within a conversational interface
        // Message activities may contain text, speech, interactive cards, and binary or unknown attachments.
        // see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
  console.log(ActivityTypes.Message);
    if (context.activity.type === ActivityTypes.Message) {
            let dialogResult;
            // Create a dialog context
            const dc = await this.dialogs.createContext(context);

            // Perform a call to LUIS to retrieve results for the current activity message.
            const results = await this.luisRecognizer.recognize(context);
            const topIntent = LuisRecognizer.topIntent(results);

            // update user profile property with any entities captured by LUIS
            // This could be user responding with their name or city while we are in the middle of greeting dialog,
            // or user saying something like 'i'm {userName}' while we have no active multi-turn dialog.
            await this.updateUserProfile(results, context);

            // Based on LUIS topIntent, evaluate if we have an interruption.
            // Interruption here refers to user looking for help/ cancel existing dialog
            const interrupted = await this.isTurnInterrupted(dc, results);
           // console.log(a);
           console.log(interrupted);
            if (interrupted) {
              //  console.log(JSON.stringify(dc));
                if (dc.activeDialog !== undefined) {
                    // issue a re-prompt on the active dialog

            
                  console.log("Active Dialog Present");
                 dialogResult = await dc.repromptDialog();
               
                 console.log(dialogResult);
                } // Else: We dont have an active dialog so nothing to continue here.
           else{
                console.log("Active Dialog Absent");
        
           //   } 
           //** Shape Top Intent//
              if(topIntent === 'Round' || topIntent === 'Rectangle' || topIntent === 'Triangle'){
                  shape = topIntent;
                const card = CardFactory.adaptiveCard(ColourCard);
                  await context.sendActivity({ attachments: [card] });
            }
             //** Colour Top Intent//
            if(topIntent === 'Yellow' || topIntent ==='Blue' || topIntent === 'Red' || topIntent === 'White'){
                color = topIntent;
                if (topIntent !== 'Yellow'){
                const topCard = CardFactory.adaptiveCard(ToppingsCard);
                  await context.sendActivity({ attachments: [topCard] });
                }
                else if(topIntent === 'Yellow'){
                    const topWithNoShellCard = CardFactory.adaptiveCard(ToppingsWithNoShell);
                    await context.sendActivity({ attachments: [topWithNoShellCard] });
                }
            }

            //**Toppings Top Intent */
            if (topIntent === "Cream" || topIntent === "Cherries" || topIntent === "Roses" || topIntent === "Shells"){
                topping = topIntent;
if ((color === 'Blue' && (topping !== 'Roses' || topping !== 'Cherries')) || (color === 'White' && (topping !=='Shells' || topping !== 'Cherries'))){
                const candleCard = CardFactory.adaptiveCard(CandlesCard);
                await context.sendActivity({ attachments: [candleCard] });
} else{
topIntent = "No";
}
            }
            //**Candle Check Top Intent */
            if(topIntent=== "Yes" || topIntent === "No"){
candleCheck = topIntent;

            

            switch (shape)
            {
                case "Round":
                switch (color)
                {
                    case "Yellow" :
                    switch(topping){
                        case "Cream" :
                            if (candleCheck === "Yes"){
                                const roundYellowCreamCandle = CardFactory.adaptiveCard(RoundYellowCreamCandle);
                                
                                await context.sendActivity({ attachments: [roundYellowCreamCandle] });
                               
                            } else if (candleCheck === "No"){
                                const roundYellowCreamNoCandle = CardFactory.adaptiveCard(YellowCard);
                                await context.sendActivity({ attachments: [roundYellowCreamNoCandle] });
                            }
                            break;
                            case "Roses" :
                            if (candleCheck === "Yes"){
                                const roundYellowRoseCandle = CardFactory.adaptiveCard(RoundYellowRoseCandle);
                                await context.sendActivity({ attachments: [roundYellowRoseCandle] });
                            } else if (candleCheck === "No"){
                                const roundYellowRoseNoCandle = CardFactory.adaptiveCard(RoundYellowRoseNoCandle);
                                await context.sendActivity({ attachments: [roundYellowRoseNoCandle] });
                            }
                            break;
                            case "Shells" :
                            if (candleCheck === "Yes"){
                                const roundYellowShellCandle = CardFactory.adaptiveCard(RoundYellowShellCandle);
                                await context.sendActivity({ attachments: [roundYellowShellCandle] });
                            } else if (candleCheck === "No"){
                                const roundYellowShellNoCandle = CardFactory.adaptiveCard(RoundYellowShellNoCandle);
                                await context.sendActivity({ attachments: [roundYellowShellNoCandle] });
                            }
                            break;
                            

                    }
                    break;
                    case "Brown" :
                    switch(topping){
                        case "Cream" :
                            if (candleCheck === "Yes"){
                                const roundBrownCreamCandle = CardFactory.adaptiveCard(RoundBrownCreamCandle);
                                
                                await context.sendActivity({ attachments: [roundBrownCreamCandle] });
                               
                            } else if (candleCheck === "No"){
                                const roundBrownCreamNoCandle = CardFactory.adaptiveCard(RoundBrownCreamNoCandle);
                                await context.sendActivity({ attachments: [roundBrownCreamNoCandle] });
                            }
                            break;
                            case "Roses" :
                            if (candleCheck === "Yes"){
                                const roundBrownRoseCandle = CardFactory.adaptiveCard(RoundBrownRoseCandle);
                                await context.sendActivity({ attachments: [roundBrownRoseCandle] });
                            } else if (candleCheck === "No"){
                                const roundBrownRoseNoCandle = CardFactory.adaptiveCard(RoundBrownRoseNoCandle);
                                await context.sendActivity({ attachments: [roundBrownRoseNoCandle] });
                            }
                            break;
                            case "Shells" :
                            if (candleCheck === "Yes"){
                                const roundBrownShellCandle = CardFactory.adaptiveCard(RoundBrownShellCandle);
                                await context.sendActivity({ attachments: [roundBrownShellCandle] });
                            } else if (candleCheck === "No"){
                                const roundBrownShellNoCandle = CardFactory.adaptiveCard(RoundBrownShellNoCandle);
                                await context.sendActivity({ attachments: [roundBrownShellNoCandle] });
                            }
                            break;
                            case "Cherry" :
                            if (candleCheck === "Yes"){
                                const roundBrownCherryCandle = CardFactory.adaptiveCard(RoundBrownCherryCandle);
                                await context.sendActivity({ attachments: [roundBrownCherryCandle] });
                            } else if (candleCheck === "No"){
                                const roundBrownCherryNoCandle = CardFactory.adaptiveCard(RoundBrownCherryNoCandle);
                                await context.sendActivity({ attachments: [roundBrownCherryNoCandle] });
                            }
                            break;
                }
                
                break;

                case "White":
                
                    switch(topping){
                        case "Cream" :
                            if (candleCheck === "Yes"){
                                const roundWhiteCreamCandle = CardFactory.adaptiveCard(RoundWhiteCreamCandle);
                                
                                await context.sendActivity({ attachments: [roundWhiteCreamCandle] });
                               
                            } else if (candleCheck === "No"){
                                const roundWhiteCreamNoCandle = CardFactory.adaptiveCard(RoundWhiteCreamNoCandle);
                                await context.sendActivity({ attachments: [roundWhiteCreamNoCandle] });
                            }
                            break;
                            case "Roses" :
                            if (candleCheck === "Yes"){
                                const roundWhiteRoseCandle = CardFactory.adaptiveCard(RoundWhiteRoseCandle);
                                await context.sendActivity({ attachments: [roundWhiteRoseCandle] });
                            } else if (candleCheck === "No"){
                                const roundWhiteRoseNoCandle = CardFactory.adaptiveCard(RoundWhiteRoseNoCandle);
                                await context.sendActivity({ attachments: [roundWhiteRoseNoCandle] });
                            }
                            break;
                           
                            case "Cherry" :
                          
                                const roundWhiteCherryCandle = CardFactory.adaptiveCard(RoundWhiteCherryCandle);
                                await context.sendActivity({ attachments: [roundWhiteCherryCandle] });
                            
                            break;
                        }
                break;

                case "Blue":
                
                    switch(topping){
                        case "Cream" :
                            if (candleCheck === "Yes"){
                                const roundBlueCreamCandle = CardFactory.adaptiveCard(RoundBlueCreamWithCandle);
                                
                                await context.sendActivity({ attachments: [roundBlueCreamCandle] });
                               
                            } else if (candleCheck === "No"){
                                const roundBlueCreamNoCandle = CardFactory.adaptiveCard(RoundBlueCreamWithNoCandle);
                                await context.sendActivity({ attachments: [roundBlueCreamNoCandle] });
                            }
                            break;
                            case "Roses" :
                            
                                const roundBlueRoseCandle = CardFactory.adaptiveCard(RoundBlueRoseWithCandle);
                                await context.sendActivity({ attachments: [roundBlueRoseCandle] });
                          
                            break;
                            case "Shells" :
                       
                                const roundBlueShellCandle = CardFactory.adaptiveCard(RoundBlueShellWithCandle);
                                await context.sendActivity({ attachments: [roundBlueShellCandle] });
                           
                            break;
                            case "Cherry" :
                          
                                const roundBlueCherryCandle = CardFactory.adaptiveCard(RoundBlueCherryWithCandle);
                                await context.sendActivity({ attachments: [roundBlueCherryCandle] });
                            
                            break;
                        }
                break;
                    }
                case "Rectangle" :
                switch(color){

                }
                break;

            
            }
        }
           }
            } else {
                // No interruption. Continue any active dialogs.
               // dialogResult = await dc.continueDialog();
              // dialogResult=     await dc.context.sendActivity(`Orange Red colour.`);
           console.log("Interuption absent");
               dialogResult = await dc.continueDialog();
               
               console.log(dialogResult);
            }

            // If no active dialog or no active dialog has responded,
            if (!dc.context.responded) {
                // Switch on return results from any active dialog.
              console.log("Active Dialog Switch");
                console.log(dialogResult);
                switch (dialogResult.status) {
                    // dc.continueDialog() returns DialogTurnStatus.empty if there are no active dialogs
                    case DialogTurnStatus.empty:
                        // Determine what we should do based on the top intent from LUIS.
                        switch (topIntent) {
                            case GREETING_INTENT:
                                await dc.beginDialog(GREETING_DIALOG);
                                break;
                               
                            
                            default:
                                // None or no intent identified, either way, let's provide some help
                                // to the user
                                await dc.context.sendActivity(`I didn't understand what you just said to me.`);
                                break;
                            }
                        break;
                        
                    case DialogTurnStatus.waiting:
                        // The active dialog is waiting for a response from the user, so do nothing.
                        break;
                    case DialogTurnStatus.complete:
                        // All child dialogs have ended. so do nothing.
                        break;
                    default:
                        // Unrecognized status from child dialog. Cancel all dialogs.
                        await dc.cancelAllDialogs();
                        break;
                }
            }
        } else if (context.activity.type === ActivityTypes.ConversationUpdate) {
            // Handle ConversationUpdate activity type, which is used to indicates new members add to
            // the conversation.
            // see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types

            // Do we have any new members added to the conversation?
            if (context.activity.membersAdded.length !== 0) {
                // Iterate over all new members added to the conversation
                for (var idx in context.activity.membersAdded) {
                    // Greet anyone that was not the target (recipient) of this message
                    // the 'bot' is the recipient for events from the channel,
                    // context.activity.membersAdded == context.activity.recipient.Id indicates the
                    // bot was added to the conversation.
                    if (context.activity.membersAdded[idx].id !== context.activity.recipient.id) {
                        // Welcome user.
                        // When activity type is "conversationUpdate" and the member joining the conversation is the bot
                        // we will send our Welcome Adaptive Card.  This will only be sent once, when the Bot joins conversation
                        // To learn more about Adaptive Cards, see https://aka.ms/msbot-adaptivecards for more details.
                        const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
                        await context.sendActivity({ attachments: [welcomeCard] });
                    }
                }
            }
        }

        // make sure to persist state at the end of a turn.
        await this.conversationState.saveChanges(context);
        await this.userState.saveChanges(context);
    }

    /**
     * Look at the LUIS results and determine if we need to handle
     * an interruptions due to a Help or Cancel intent
     *
     * @param {DialogContext} dc - dialog context
     * @param {LuisResults} luisResults - LUIS recognizer results
     */
    async isTurnInterrupted(dc, luisResults) {
        const topIntent = LuisRecognizer.topIntent(luisResults);

        // see if there are anh conversation interrupts we need to handle
        if (topIntent === CANCEL_INTENT) {
            if (dc.activeDialog) {
                // cancel all active dialog (clean the stack)
                await dc.cancelAllDialogs();
                await dc.context.sendActivity(`Ok.  I've cancelled our last activity.`);
            } else {
                await dc.context.sendActivity(`I don't have anything to cancel.`);
            }
            return true; // this is an interruption
        }

        if (topIntent === HELP_INTENT) {
            await dc.context.sendActivity(`Let me try to provide some help.`);
            await dc.context.sendActivity(`I understand greetings, being asked for help, or being asked to cancel what I am doing.`);
            return true; // this is an interruption
        }

        if(topIntent === FRUIT_INTENT || topIntent === "Blue" || topIntent === "Red" || topIntent === "White" || topIntent === "Brown" || topIntent === "Cream" || topIntent === "Shells" || topIntent === "Roses" || topIntent === "Cherries" || topIntent==="Yes" || topIntent === "No"){
          //  console.log("Yellowwww start");
            //await dc.context.sendActivity(`Here is your cake!!`);
       
            return true; 
        }


        if(topIntent === "Round" || topIntent === "Rectangle" || topIntent === "Triangle"){
            await dc.context.sendActivity(`You have selected ${topIntent} shape . Please select the cake colour`);
       
            return true; 
        }
        // if (topIntent === "Blue"){
        //     await dc.context.sendActivity(`Here is your cake!!`);
        //     return true;
        // }
        // if (topIntent === "Red"){
        //     await dc.context.sendActivity(`Here is your cake!!`);
        //     return true;
        // }
        return false; // this is not an interruption
    }

    /**
     * Helper function to update user profile with entities returned by LUIS.
     *
     * @param {LuisResults} luisResults - LUIS recognizer results
     * @param {DialogContext} dc - dialog context
     */
    async updateUserProfile(luisResult, context) {
        // Do we have any entities?
        if (Object.keys(luisResult.entities).length !== 1) {
            // get userProfile object using the accessor
            let userProfile = await this.userProfileAccessor.get(context);
            if (userProfile === undefined) {
                userProfile = new UserProfile();
            }
            // see if we have any user name entities
            USER_NAME_ENTITIES.forEach(name => {
                if (luisResult.entities[name] !== undefined) {
                    let lowerCaseName = luisResult.entities[name][0];
                    // capitalize and set user name
                    userProfile.name = lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.substr(1);
                }
            });
            USER_LOCATION_ENTITIES.forEach(city => {
                if (luisResult.entities[city] !== undefined) {
                    let lowerCaseCity = luisResult.entities[city][0];
                    // capitalize and set user name
                    userProfile.city = lowerCaseCity.charAt(0).toUpperCase() + lowerCaseCity.substr(1);
                }
            });
            // set the new values
            await this.userProfileAccessor.set(context, userProfile);
        }
    }
}

module.exports.BasicBot = BasicBot;
