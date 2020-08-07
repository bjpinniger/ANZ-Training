const xapi = require('xapi'),
  modeWidgetId = 'proximityMode',
  volumeWidgetId = 'proximityVolume',
  availabilityWidgetId = 'proximityAvailability',
  availabilityTextId = 'proximityServicesText',
  proximityHelpWidgetId = 'proximityHelp';

let storedProximityMode = '',
  maxVolume = 70;

//Set the In-Room control widgets appropriately
function setWidget(widgetId, widgetValue) {
  switch (widgetId) {
    case modeWidgetId:
      if (widgetValue === 'On') {
        xapi.command('UserInterface Extensions Widget SetValue', {'Value': 'on', 'WidgetId': widgetId});
        storedProximityMode = 'On';
        setFromConfig(volumeWidgetId);
        setFromConfig(availabilityWidgetId);
      } else if (widgetValue === 'Off') {
        xapi.command('UserInterface Extensions Widget SetValue', {'Value': 'off', 'WidgetId': widgetId});
        storedProximityMode = 'Off';
        setWidget(volumeWidgetId, 0);
      }
      break;
    case volumeWidgetId:
      let sliderLevel = Math.ceil(255 / maxVolume * widgetValue);
      if (storedProximityMode === 'On') {
        xapi.command('UserInterface Extensions Widget SetValue', {'Value': sliderLevel, 'WidgetId': widgetId});
      } else if (storedProximityMode === 'Off') {
        xapi.command('UserInterface Extensions Widget SetValue', {'Value': 1, 'WidgetId': widgetId});
      }
      break;
    case availabilityWidgetId:
         //Get the config state for everything that will prevent enabling services
        Promise.all([
          xapi.config.get('Proximity Services CallControl'),
          xapi.config.get('Proximity Services ContentShare FromClients'),
          xapi.config.get('Proximity Services ContentShare ToClients')
        ])
        .then(([proximityCallControl, proximityFromClients, proximityToClients]) => {
          //If the services are in a state that prevents enabling the widget, put warning text up
          if (storedProximityMode == 'Off') {
            xapi.command('UserInterface Extensions Widget setValue', {'Value': 'Cannot Activate, Proximity mode is disabled!', 'WidgetId': availabilityTextId});
            xapi.command('UserInterface Extensions Widget SetValue', {'Value': 'off', 'WidgetId': widgetId});
          } else if (proximityCallControl == 'Disabled' && proximityFromClients == 'Disabled' && proximityToClients == 'Disabled') {
            xapi.command('UserInterface Extensions Widget setValue', {'Value': 'Cannot Activate, all Proximity services are disabled!', 'WidgetId': availabilityTextId});
            xapi.command('UserInterface Extensions Widget SetValue', {'Value': 'off', 'WidgetId': widgetId});
          } else if (widgetValue == "Deactivated" || widgetValue == "Disabled") {
            xapi.command('UserInterface Extensions Widget UnsetValue', {'WidgetId': availabilityTextId});
            xapi.command('UserInterface Extensions Widget SetValue', {'Value': 'off', 'WidgetId': widgetId});
          } else if (widgetValue == "Available") {
            xapi.command('UserInterface Extensions Widget UnsetValue', {'WidgetId': availabilityTextId});
            xapi.command('UserInterface Extensions Widget SetValue', {'Value': 'on', 'WidgetId': widgetId});
          }
        });
       
      break;
    default:
      console.log("Unknown Widget!");
  }
}

//Check if the In-Room control change is from the correct widget and make config change
function onGuiEvent(event) {
  if (event.WidgetId == modeWidgetId) {
    xapi.config.set('Proximity Mode', event.Value);
  } else if (event.WidgetId == volumeWidgetId && event.Type === 'released') {
      if (storedProximityMode === 'On') {
        let newVolume = Math.ceil(event.Value * maxVolume / 255);
        xapi.config.set('Audio Ultrasound MaxVolume', newVolume);
      } else if (storedProximityMode === 'Off') {
        setWidget(volumeWidgetId, 0);
      }
  } else if (event.WidgetId == availabilityWidgetId) {
    if (event.Value == 'on') {
      //Issue command to activate services
      xapi.command('Proximity Services Activate').then(() => {
        //Check if the status changed
        xapi.status.get('Proximity Services Availability').then((statusProximityServices) => {
          //Set the widget per the status
          setWidget(availabilityWidgetId, statusProximityServices);
        });
      });
    } else if (event.Value == 'off') {
      xapi.command('Proximity Services Deactivate').then(() => {
        xapi.status.get('Proximity Services Availability').then((statusProximityServices) => {
          //Set the widget per the status
          setWidget(availabilityWidgetId, statusProximityServices);
        });
      });
    }
  } else if (event.WidgetId == proximityHelpWidgetId) {
    xapi.command('UserInterface Message Alert Display', 
    {'Duration': '20', 
    'Text': 'Proximity Mode will enable and disable Proximity and auto wakeup. Proximity Availability leaves ultrasound on but Proximity services are not available. Proximity Volume determines how loud the ultrasound emission is.', 
    'Title': "Help"});
  }
}

//Set the panel widget to the current config
function setFromConfig(widgetId) {
  switch (widgetId) {
    case modeWidgetId:
      xapi.config.get('Proximity Mode').then((configProximityMode) => {
        setWidget(modeWidgetId, configProximityMode);
      });
      break;
    case volumeWidgetId:
      xapi.config.get('Audio Ultrasound MaxVolume').then((configUltrasoundVolume) => {
        setWidget(volumeWidgetId, configUltrasoundVolume);
      });
      break;
    case availabilityWidgetId:
      xapi.status.get('Proximity Services Availability').then((statusProximityAvailability) => {
        setWidget(availabilityWidgetId, statusProximityAvailability);
      });
      break;
    default:
      //Proximity Mode
      xapi.config.get('Proximity Mode').then((configProximityMode) => {
        setWidget(modeWidgetId, configProximityMode);
      });
      
      //Proximity Volume
      xapi.config.get('Audio Ultrasound MaxVolume').then((configUltrasoundVolume) => {
        setWidget(volumeWidgetId, configUltrasoundVolume);
      });
      
      //Proximity Availability
      xapi.status.get('Proximity Services Availability').then((statusProximityAvailability) => {
        setWidget(availabilityWidgetId, statusProximityAvailability);
      });
  }
}

function setupGui() {
  //Find out if we are on a DX70 and if so change the maxVolume
  xapi.status.get('SystemUnit ProductPlatform').then((productType) => {
    if (productType === 'DX70') {
      maxVolume = 60;
    }
  });
  
  //Clear the textbox incase someone left the default text in there
  xapi.command('UserInterface Extensions Widget UnsetValue', {'WidgetId': availabilityTextId});
  
  //Set the panel correctly
  setFromConfig();
  
  //Send any In-Room control events to the onGuiEvent function
  xapi.event.on('UserInterface Extensions Widget Action', onGuiEvent);
  
  //If the In-Room control panels get updated, set the panel widget correctly
  xapi.event.on('UserInterface Extensions Widget LayoutUpdated', setFromConfig);
  
  // Start monitoring proximity mode config
  xapi.config.on('Proximity Mode', (configProximityMode) => {
    setWidget(modeWidgetId, configProximityMode);
  });
  
  // Start monitoring proximity volume config
  xapi.config.on('Audio Ultrasound MaxVolume', (configUltrasoundVolume) => {
    setWidget(volumeWidgetId, configUltrasoundVolume);
  });
  
  // Start monitoring proximity services status
  xapi.status.on('Proximity Services Availability', (statusProximityAvailability) => {
    setWidget(availabilityWidgetId, statusProximityAvailability);
  });
}

//start the macro
setupGui();