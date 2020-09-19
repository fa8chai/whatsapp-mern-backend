import mongoose from 'mongoose';


const whatsappSchema = mongoose.Schema({
    roomId: String,
    message: String,
    name: String,
    timestamp: String,
    received: Boolean,
})

export default mongoose.model('messagecontents', whatsappSchema)
