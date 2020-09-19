// importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Rooms from './dbRooms.js';
import Pusher from 'pusher';
import cors from 'cors';

// app config
const app = express()
const port = process.env.PORT || 9000

// middleware
app.use(express.json());
app.use(cors());


// db config
const connection_url = 'mongodb+srv://admin:MP6qyuUbQ4RCTvsK@cluster0.ea0nw.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser:true,
    useUnifiedTopology: true
});

const pusher = new Pusher({
    appId: '1075068',
    key: 'e54facc66686c280c2c8',
    secret: '3c528a646d03b3d5cf2f',
    cluster: 'eu',
    encrypted: true
  });



// change stream
const db = mongoose.connection
db.once('open', () => {
    console.log('DB is connected');
    const msgCollection = db.collection('messagecontents');
    const roomsCollection = db.collection('rooms');
    const roomsChangeStream = roomsCollection.watch();
    roomsChangeStream.on('change', (change) => {
        if (change.operationType == 'insert') {
            const roomDetails = change.fullDocument;
            pusher.trigger('rooms', 'inserted', {
                _id: roomDetails._id,
                name: roomDetails.name,
                userId: roomDetails.userId,
            });
        } 
        if (change.operationType == 'delete') {
            pusher.trigger('rooms', 'deleted', {
                data: true
            })
        }
        else {
            console.log('Error triggering Pusher');
        }
    })
    const changeStream = msgCollection.watch();
    changeStream.on('change', (change) => {
        if (change.operationType == 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            });
        } else {
            console.log('Error triggering Pusher');
        }
    });
});

// api routes
app.get('/', (req, res) => res.status(200).send('hello world'))

app.get('/messages/sync', (req, res) => {
    const roomId = req.query.id;
    Messages.find({'roomId': roomId} , (error, data) => {
        if (error) {
            res.status(500).send(error)
        }else {
            res.status(200).send(data)
        }
    })
})

app.get('/room', (req, res) => {
    const id = req.query.id;
    Rooms.findOne({'_id': id} , (error, data) => {
        if (error) {
            res.status(500).send(error)
        }else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body
    Messages.create(dbMessage, (error, data) => {
        if (error) {
            res.status(500).send(error)
        }else {
            res.status(201).send(data)
        }
    })
})
app.delete('/rooms/delete/:roomId', (req, res) => {
    const roomId = req.params.roomId
    Rooms.deleteOne({'_id': roomId}, (error, data) => {
        if (error) {
            res.status(500).send(error)
        }else {
            res.status(200).send(data)
        }
    })

})
app.get('/rooms/search', (req, res) => {
    let search = req.query.value
    Rooms.find({ 'name': {$regex: search, $options: 'i'}}, (error, data) => {
        if(data) {
            res.status(200).send(data)
        } else {
            res.status(500).send(error)
        }
    })
})
app.get('/rooms/sync', (req, res) => {
    Rooms.find((error, data) => {
        if (error) {
            console.log('error...')
            res.status(500).send(error)
        }else {
            data = data.reverse()
            res.status(200).send(data)
        }
    })
})
app.post('/rooms/new', (req, res) => {
    const dbRoom = req.body
    Rooms.create(dbRoom, (error, data) => {
        if (error) {
            res.status(500).send(error)
        }else {
            res.status(201).send(data)
        }
    })

})
// listen

app.listen(port, () => console.log(`Listening on localhost:${port}`))