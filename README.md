# IoT-PUMMA
Handling program for REST-API and MQTT data collecting from IoT Devices

# How to use
1. Make sure you have installed <code>node.js</code> and <code>npm</code>
2. Simply <code>git clone</code> or download this repo, <code>cd</code> into the project folder.
3. install required library with command <code>npm install</code>
4. Open <code>.env-example</code> file, edit the configuration, save and rename as <code>.env</code>

# Running program
To run MQTT Handler Program, use command <code>node mqtt_only.js</code> or <code>pm2 start mqtt_only.js</code>
To run REST-API, use command <code>node rest_only.js</code> or <code>pm2 start rest_only.js</code>

