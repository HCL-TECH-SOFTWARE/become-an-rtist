# become-an-rtist
This is a sketch drawing game built with [HCL RTist](https://www.devops-community.com/realtime-software-tooling-rtist.html). It is intended to run on a Raspberry Pi 3+ equipped with a camera and a push button. In addition to the RTist C++ application that runs on the Raspberry Pi, the system also consists of the following applications:
* An image recognizer Python script. It runs on the Raspberry Pi as an HTTP server to serve requests for image recognition.
* A web server implemented in Node JS. The RTist application communicates with it over HTTP. This web server can run on a different machine, for example a laptop that is connected to the same network as the Raspberry Pi.
* A web application implemented in JavaScript, HTML and CSS. This runs in a web browser on any computer.
For more information about the game set-up and how it works, see <a href="https://github.com/hcl-pnp-rtist/become-an-rtist/blob/master/BecomeAnRTist.pdf">these slides</a>.

## Hardware setup
A bill of material can be found [here](BOM).
* Connect the camera to the Raspberry Pi and enable it in the Pi settings. 
* Connect the push button to the Raspberry Pi. One wire should have a resistor and connect to GPIO 1 (3.3 V), and the other wire should connect to GPIO 10.
* Make sure the Raspberry Pi is on the same network as the computer where the web server will run. For best performance, assign a static IP address to the Raspberry Pi and connect it directly to the computer with an ethernet cable. For example, follow these <a href="http://www.circuitbasics.com/how-to-connect-to-a-raspberry-pi-directly-with-an-ethernet-cable/">instructions</a>. Then update your hosts file and assign the name "rtist-pi" to the IP address of the Raspberry Pi.
* Place the Raspberry Pi on a desk lamp, with the camera facing down.
* Calibrate the camera so that it can get a good shot of a regular A4 paper placed under the lamp. Start by installing some useful tools in the Pi by following these <a href="https://blog.miguelgrinberg.com/post/how-to-build-and-run-mjpg-streamer-on-the-raspberry-pi">instructions</a>.
  * Open a terminal and login to the Raspberry Pi. Perform these commands:
  
    `mkdir /tmp/stream`
    
    `raspistill --nopreview -w 640 -h 480 -q 5 -o /tmp/stream/pic.jpg -tl 100 -t 9999999 -th 0:0:0`
  * Open another terminal, login to the Pi and then perform this command:
  
    `LD_LIBRARY_PATH=/usr/local/lib mjpg_streamer -i "input_file.so -f /tmp/stream -n pic.jpg" -o "output_http.so -w /usr/local/www"`

  * Open [http://rtist-pi:8080/stream.html](http://rtist-pi:8080/stream.html) in a web browser to see a live stream from the camera.
    
    Move the paper under the lamp, and adjust the lamp height, until the paper is fully visible by the camera. Then mark the paper position, for example using a transparent tape.
    
* Enable and test the push button by running the Python 2.7 script [button_test.py](image_recognition/button_test.py). There should be several printouts each time the button is pushed.
    
## Set-up image recognition on the Raspberry Pi
* Install Tensorflow on the Raspberry Pi by following these [instructions](https://www.tensorflow.org/install/pip?lang=python2) (for Python 2.7).
* Open a terminal on the Raspberry Pi and perform the command 

  `source ~/venv/bin/activate`

* Copy the script [label_image_server.py](image_recognition/label_image_server.py) to the folder /become-an-rtist/image-recognition on the Pi. Also copy the trained Tensorflow model [output_graph.pb](image_recognition/output_graph.pb) and the list of words to recognize [output_labels.txt](image_recognition/output_labels.txt) to the same place. Then go into that folder and perform the command:

  `python label_image_server.py --graph=output_graph.pb --labels=output_labels.txt --input_layer=Placeholder --output_layer=final_result --input_height=224 --input_width=224`

The script now waits for incoming HTTP image recognition requests on port 5555.
    
## Build the application
* The communication with the web server and the Python script uses the [lib-http-server](https://github.com/hcl-pnp-rtist/lib-http-server) library, so you must start by cloning that repository also into your workspace.
* You must build the POCO shared libraries for the Raspberry Pi. This can either be done using cmake (see POCO documentation) or you can add the POCO sources to an Eclipse cross-compilation project and build them yourself. You only need the Foundation and the Net libraries. Copy them to /home/pi/become-an-rtist/ on the Raspberry Pi.
* You also must build the library [wiringpi](http://wiringpi.com/). Build it to a static library so you don't have to copy it to the Raspberry Pi.
* Update the TC rtapp.tcjs by setting the property tc.pocoLoc to the location of the POCO library. Also update the tc.linkArguments property for the build location of the POCO libraries to link with, and update tc.inclusionPaths accordingly.
* Make sure you have installed the cross compiler for Raspberry Pi and that its build tools (make and g++) are in the PATH. 
* Build the TC by right-clicking on it and do **Build**.

## Starting the web server
* `cd webapp`

* `npm install`

* `node app.js`

* Open [http://localhost:5000/](http://localhost:5000/) in a web browser

## Start the game application
Note: To start the application from within RTist it is recommended to install the Remote Systems plugin for Eclipse. This makes it possible to automate the below steps in a launch configuration.

* Copy the built executable to /home/pi/become-an-rtist/executable
* Run these commands

  `sudo -i`
  
  `export LD_LIBRARY_PATH=/home/pi/become-an-rtist`

and then start the executable on the Pi with this command

`./executable -obslisten=12345 -webhost=192.168.137.1 -webport=5000`

Replace the IP address with the IP address of the computer that runs the web server.
When the web application shows the hiscore list, the game is ready to play!