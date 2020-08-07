import xapi from 'xapi';

const PIN_CODE = '1234';

init();
listenToEvents();

function init(){
  console.log('checking Feature Mode');
  xapi.config.get('UserInterface Features').then ((value) => {
    var HideAllVal = value.HideAll;
    console.log("Hide All Value: " + HideAllVal);
    if (HideAllVal == "False"){
      xapi.config.set('UserInterface Features HideAll', 'True');
    }
  });
}

function listenToEvents() {
  xapi.event.on('UserInterface Message TextInput Response', (event) => {
    if (event.FeedbackId === 'pin-code')
      onResponse(event.Text);
  });
}

function showPinInput() {
  xapi.command('UserInterface Message TextInput Display', {
    FeedbackId: 'pin-code',
    Text: 'Enter PIN code',
    InputType: 'PIN',
    Placeholder: ' ',
    Duration: 0,
  });
}

function onResponse(code) {
  if (code === PIN_CODE){
    xapi.config.set('UserInterface Features HideAll', 'False');
    console.log("PIN correct, changing lock state")
  } else {
    sendAlert("Wrong PIN, try again.")
    console.log("Wrong PIN")
  }
}

function sendAlert(Message){
  xapi.command("UserInterface Message Alert Display", {
                  Title: 'Failure'
                  , Text: Message
                  , Duration: 10
              }).catch((error) => { console.error(error); });
}

xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
  if (event.PanelId == 'unlock'){
    console.log("user attempting to change lock state")
    showPinInput();
  }
});
