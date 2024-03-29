# Become an RTist
![become an rtist](https://github.com/hcl-pnp-rtist/become-an-rtist/blob/master/images/ready.png "Become An RTist")

This is a sketch drawing game built with [DevOps Model RealTime](https://www.hcl-software.com/devops-model-realtime) (formerly known as HCL RTist). It is intended to run on a Raspberry Pi 3+ (or newer) equipped with a camera and a push button. In addition to the Model RealTime generated C++ application that runs on the Raspberry Pi, the system also consists of the following applications:
* An image recognizer Python script. It runs on the Raspberry Pi as an HTTP server to serve requests for image recognition.
* A web server implemented in Node JS. The C++ application communicates with it over HTTP. This web server can run on a different machine, for example a laptop that is connected to the same network as the Raspberry Pi.
* A web application implemented in JavaScript, HTML and CSS. This runs in a web browser on any computer.

For more information about the game set-up and how it works, see <a href="https://github.com/HCL-TECH-SOFTWARE/become-an-rtist/blob/master/BecomeAnRTist.pdf">these slides</a>. Also watch [this video](https://www.youtube.com/watch?v=UPmKu93ESZ8) to get an overview of the game and see it in action.

## Hardware setup
A bill of material can be found [here](BOM.md).
* Connect the camera to the Raspberry Pi and enable it in the Pi settings. 
* Connect the push button to the Raspberry Pi. Connect one wire to pin 6 (GND) and another to pin 12 (GPIO 18). It's not necessary to use resistors, but having them also won't hurt. 
* Make sure the Raspberry Pi is on the same network as the computer where the web server will run. For best performance, assign a static IP address to the Raspberry Pi and connect it directly to the computer with an ethernet cable. For example, follow these <a href="http://www.circuitbasics.com/how-to-connect-to-a-raspberry-pi-directly-with-an-ethernet-cable/">instructions</a>. Then update your hosts file (on both machines, including /etc/hosts on RPi) and assign the name "rtist-pi" to the IP address of the Raspberry Pi.
* Place the Raspberry Pi on a desk lamp, with the camera facing down.
* Calibrate the camera so that it can get a good shot of a regular A4 paper placed under the lamp. Start by installing some useful tools in the Pi by following these <a href="https://blog.miguelgrinberg.com/post/how-to-build-and-run-mjpg-streamer-on-the-raspberry-pi">instructions</a>.
  * Open a terminal and login to the Raspberry Pi. Perform these commands:
  
    `mkdir /tmp/stream`
    
    `raspistill --nopreview -w 640 -h 480 -q 5 -o /tmp/stream/pic.jpg -tl 100 -t 9999999 -th 0:0:0`
  * Open another terminal, login to the Pi and then perform this command:
  
    `LD_LIBRARY_PATH=/usr/local/lib mjpg_streamer -i "input_file.so -f /tmp/stream -n pic.jpg" -o "output_http.so -w /usr/local/www"`

  * Open [http://rtist-pi:8080/stream.html](http://rtist-pi:8080/stream.html) in a web browser to see a live stream from the camera.
    
    Move the paper under the lamp, and adjust the lamp height, until the paper is fully visible by the camera. Then mark the paper position, for example using a transparent tape.
    
* Initialize and test the push button by running the Python 2.7 script [button_test_2.py](image_recognition/button_test_2.py). There should be a printout each time the button is pushed.
    
## Set-up image recognition on the Raspberry Pi
* Install libraries required for Tensorflow

  ` sudo apt-get install libhdf5-dev`

* Install Tensorflow on the Raspberry Pi by following these [instructions](https://www.tensorflow.org/install/pip?lang=python2) (for Python 2.7).
* Open a terminal on the Raspberry Pi and perform the command 

  `source ~/venv/bin/activate`

* Copy the script [label_image_server.py](image_recognition/label_image_server.py) to the folder /become-an-rtist/image_recognition on the Pi. Also copy the trained Tensorflow model [output_graph.pb](image_recognition/output_graph.pb) and the list of words to recognize [output_labels.txt](image_recognition/output_labels.txt) to the same place. Then go into that folder and perform the command:

  `python label_image_server.py --graph=output_graph.pb --labels=output_labels.txt --input_layer=Placeholder --output_layer=final_result --input_height=224 --input_width=224`

The script now waits for incoming HTTP image recognition requests on port 5555.
    
## Build game application on a computer

### Install Required Software
1. [Model RealTime]([https://www.devops-community.com/realtime-software-tooling-rtist.html](https://www.hcl-software.com/devops-model-realtime))
2. **On Windows:** [Raspberry Pi cross-compiler](http://gnutoolchains.com/raspberry/)

Make sure that its **bin** folder (with make and g++) has been added to **PATH** variable.

### Prepare sources and build the application
1. The communication with the web server and the Python script uses the [lib-http-server](https://github.com/hcl-pnp-rtist/lib-http-server) library. Clone the project and import it to your workspace.

  `git clone https://github.com/HCL-TECH-SOFTWARE/lib-http-server.git`

2. [Paho-MQTT](https://www.eclipse.org/paho/downloads.php) 
    1. Get sources
    
    `git clone https://github.com/eclipse/paho.mqtt.c.git`
  
    2. Buld them or use [pre-built libs](libs/paho_mqtt_lib.zip) from this repo.
    3. Copy **libpaho-mqtt3c.so.1** to **/home/pi/become-an-rtist/** on the Raspberry Pi.
  
3. [POCO](https://pocoproject.org/)
    1. You must build the POCO shared libraries for the Raspberry Pi. This can either be done using cmake (see POCO documentation) or you can add the POCO sources to an Eclipse cross-compilation project and build them yourself. 
    2. Only **Foundation** and the **Net** libraries are used.    
    3. You may use the [Eclipse project](libs/poco_eclipse_projects.zip) from this repo to build libraries.
    4. Import it into your workspace, configure the path to the Raspberry cross-compiler in **project properties -> C/C++ Build -> Settings -> Cross Settings**,    
    5. Build the projects.
    6. Copy the shared libraries to **/home/pi/become-an-rtist/** on the Raspberry Pi.
    
4. [WiringPi](http://wiringpi.com/)
    1. You may use [eclipse project](libs/wiringPi.zip) from this repo to build the library.
    2. Import it into your workspace, configure the path to the Raspberry cross-compiler in **project properties -> C/C++ Build -> Settings -> Cross Settings, and build project.**
    3. Build it. It will be built into a static library, so you don't have to copy it to the Raspberry Pi.
    
5. Build the Model RealTime TargetRTS for Raspberry Pi
    1. Make a copy of any Linux TargetRTS
    2. In Model RealTime run **Target RTS Wizard** from the **TargetRTS** top menu.
    3. Select LinuxT.x64-gcc-12.x configuration and the **Duplicate** option from the **Manage** list.
    4. Under **Create New** check **Target Name** and **Libset Name**
    5. Click **Finish**
    6. For Windows you can use the file from this repo [libset.mk](libset.mk), copy it to **<ModelRealTime_Installation_DIR>\rsa_rt\C++\TargetRTS\libset\\<created_libset_name>\libset.mk** 
    7. Use **Target RTS Wizard again**, select newly created target and the **Build** option from the **Manage** list.
    8. Click **Finish** and ensure the TargetRTS is built successfully.

6. Update the TC **rtapp.tcjs** by doing the following.
    1. Set the property **tc.pocoLoc** to the location of the POCO library. If you imported **Poco_Net** and **Poco_Foundation** projects from this repository it would be the path to your Model RealTime workspace.
    2. If using **Poco_Net** and **Poco_Foundation** projects open **httpServerLib.tcjs** file in **LibHttpServer** project and modify **tc.inclusionPaths** property by replacing **Net** with **Poco_Net** and **Foundation** with **Poco_Foundation**
    3. Set **tc.taretConfiguration** with the name of Target you created in the previous step.
    4. Ensure **tc.targetServicesLibrary** is set to TargetRTS path. E.g. **<ModelRealTime_Installation_DIR>\rsa_rt\C++\TargetRTS**
    5. Update **tc.inclusionPaths** so it points to WiringPi and Paho MQTT sources.
    6. Update **tc.linkArguments** property to reference the build location of the **POCO**, **WiringPi**, and **PahoMQTT** binaries
    
7. Build the TC by right-clicking on it and selecting **Build...**.

## Starting the web server
1. Install [Nodejs](https://nodejs.org/en/download/)

2. Go to webapp folder

`cd webapp`

3. Get the dependencies

`npm install`

4. During each round of the game sample images of the same word are shown.
    1. For this to work download [image archive](https://drive.google.com/open?id=12CoTw4aE1OSRWp0qEgsdbgP0TNc_HVKW) (2.8 Gb)
    2. Extract the contents to some folder
    3. Edit **sample_images_dir** property in [appconfig.json](webapp/appconfig.json) to point to the folder where the images were extracted.

5. Start the application

`node app.js`

6. Open [http://localhost:5000/](http://localhost:5000/) in a web browser

## MQTT Setup
See [these instructions](MQTT.md) to add a game dashboard updated via MQTT.

## Start the game application
The easiest way to start the application on the Pi is to create a **C/C++ Remote Application** run configuration in Model RealTime.
* Make sure the project and executable are set correctly, e.g. to **IoTBecomeAnRTist_target** and **default\executable.EXE**
* Create a new ssh connection to Raspberry pi and specify the remote path to be **/home/pi/become-an-rtist/executable**
* In the **Commands to execute before application** section add the following

  `sudo -i`
  
  `export LD_LIBRARY_PATH=/home/pi/become-an-rtist`
 
 * In the **Arguments** tab add the following arguments
  
  `-webhost=192.168.137.1 -webport=5000 -propFile=/home/pi/become-an-rtist/game.properties`

Replace **webhost** with the IP address of the computer that runs the web server. Replace the propFile path with the path on the Pi where you have copied the file [game.properties](game.properties).

* To be able to attach the Model RealTime debugger to the application also add **obslisten** argument with a port number, e.g.

  `-obslisten=12345`

* Run the remote C/C++ application created

* If **obslisten** argument was specified, attach the Model RealTime debugger by right clicking on the **rtapp** transformation configuration and selecting **Debug As -> Remote realtime application (attach)** from the context menu. Specify the Raspberry Pi hostname and **obslisten** port number in the dialog. Resume the application after the Model RealTime debugger is attached.

* The web application will show the hiscore list, when the game is ready to play!
