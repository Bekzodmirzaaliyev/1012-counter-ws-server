const express = require("express");
const messageModel = require("../models/messageModel");

const router = express.Router();

router.get('/:userid1/:userid2', async (req, res) => {
    try {
        const {userid1, userid2} = req.params

        const message = await messageModel.find({
            $or: [
                {from: userid1, to: userid2},
                {from: userid2, to: userid1}
            ]
        }).sort({timeStamp: 1})

        res.status(200).json(message)
    } catch(e) {
        console.log(e)
        res.status(500).json("Server error: ", e)   
    }
})

module.exports = router
