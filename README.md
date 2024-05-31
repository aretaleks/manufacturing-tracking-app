Manufacturing Tracking App
--------------------------

This is a web application that I made for an Estonian wooden door manufacturing company.
One of the main requirements was that it needed to run on older browsers like Chrome version 49.
Considering that and my small knowledge of application building I decided to use a basic stack.
The application's logic is mainly written with the help of jQuery, Express and plain JavaScript.
For the UI I used HTML and CSS.

The application allows production line workers to insert information on on-going orders to the app 
and get technical drawings based on order number. The inserted data is stored in MS SQL Server and
later used in Power BI for analytics.

There's a functionality to automatically get the client's name based on the order number.
The information is pulled from the CRM API.

Main UI:
![image](https://github.com/aretaleks/manufacturing-tracking-app/assets/31519197/01676b1a-9069-41cc-91ac-01b3310804ba)

Filters UI view:
![image](https://github.com/aretaleks/manufacturing-tracking-app/assets/31519197/5ff97b9b-5c13-4e10-bbdf-8c99f04754f3)

