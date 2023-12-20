# MQTT Setup
To make the game really connected with [MQTT](http://mqtt.org/) follow the steps below.
## Install MQTT broker
Raspberry Pi running the game must be able to connect to MQTT broker. One of the options is to install and run [Mosquitto](https://mosquitto.org/download/) on the Pi itself.

## Configure game connection settings
Modify [game.properties](game.properties) file on Raspberry Pi by setting 
**MQTT**  to true and to **MQTT_URL** MQTT broker connection URL.

## Import Node-Red flows
1. Create a new Node-RED server in **Servers** view of Model RealTime or use an existing one.
2. Start the Node-RED server.
3. If not done previously, install [node-red-dashboard](https://flows.nodered.org/node/node-red-dashboard) by selecting **Manage palette** from the top menu. In **Install** tab find and install node-red-dashboard.
4. From the top menu pick **Import->Clipboard** and select [flows.json](node-red\flows.json) file to import.
5. Edit MQTT input node by editing MQTT server connection.
6. Deploy the flows.
7. Open game dashboard by navigating to <NODE_RED_SERVER_URL>/ui, e.g. [http://localhost:1880/ui](http://localhost:1880/ui).
