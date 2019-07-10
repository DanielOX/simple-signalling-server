let webServerSocket = require('ws').Server;
let wss = new webServerSocket({ port: 8888 });
let users = {};
wss.on('connection', function (connection) {
    console.log('User Connected')
    connection.on('message', function (message) {
        let data;

        try {
            data = JSON.parse(message);
        } catch (error) {
            console.log('error parsing json');
            data = {}
        }



        switch (data.type) {

            case 'login':
                console.log('User Logged In As ' + data.name)

                if (users[data.name]) {
                    sendTo(connection, {
                        type: 'login',
                        success: false
                    })
                } else {
                    users[data.name] = connection;
                    connection.name = data.name;
                    sendTo(connection, {
                        type: 'login',
                        success: true
                    })
                }

                break;

            case "offer":
                console.log("sending offer to " + data.name);
                let conn = users[data.name]
                if (conn != null) {
                    connection.otherName = data.name;
                    sendTo(conn, {
                        type: 'offer',
                        offer: data.offer,
                        name: connection.name
                    })
                }
                break;

            case "answer":
                console.log("sending answer to " + data.name);
                let conn = users[data.name]
                if (conn != null) {
                    connection.otherName = data.name;
                    sendTo(conn, {
                        type: 'answer',
                        answer: data.answer,
                    })
                }
                break;
            case "candidate":
                console.log("Sending ice candidate to: " + data.name)
                let conn = users[data.name];
                if (conn != null) {
                    sendTo(conn, {
                        type: 'answer',
                        candidate: data.candidate,
                    })
                }
                break;

            case "leave":
                console.log("disconnecting user from: " + data.name);
                let conn = users[data.name];
                conn.otherName = null;
                if (conn != null) {
                    sendTo(conn, {
                        type: 'leave'
                    })
                }



            default:
                sendTo(connection, {
                    type: 'error',
                    message: 'unrecognized command: ' + data.type
                })
                break;
        }

    });

    connection.send('Hello World')

    connection.on('close', function () {
        if (connection.name) {
            delete users[connection.name]
        }
        if (connection.otherName) {
            console.log('Disconnecting User From' + connection.otherName);

            var conn = users[connection.otherName];
            conn.otherName = null;

            if (conn != null) {
                sendTo(conn, {
                    type: "leave"
                });
            }

        }
    })














});











function sendTo(conn, message) {
    conn.send(JSON.stringify(message));
}