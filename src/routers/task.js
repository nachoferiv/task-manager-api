const express = require('express')
const mongoose = require('mongoose')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=0
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed =  req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'asc' ? 1 : -1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id

        if (mongoose.Types.ObjectId.isValid(_id)) {
            const task = await Task.findOne({ _id, owner: req.user._id })
 
            if(!task) {
                return res.status(404).send()
            }

            return res.send(task)
        } else {
            res.status(404).send()
        }
    } catch (error) {
        res.status(500).send(error)
    }    
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updateFields = Object.keys(req.body)
    const validFields = ['description','completed']
    const isValidUpdate = updateFields.every((field) => validFields.includes(field))

    if (!isValidUpdate) {
        return res.status(400).send({
            'error': 'Invalid fields.'
        })
    }

    try {
        const _id = req.params.id
        
        if (mongoose.Types.ObjectId.isValid(_id)) {
            const task = await Task.findOne({ _id, owner: req.user._id })
            
            if (!task) {
                return res.status(404).send()
            }

            updateFields.forEach((field) => task[field] = req.body[field])
            task.save()
            return res.send(task)
        } else {
            res.status(404).send()
        }
    } catch (error) {
        res.status(500).send(error)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id

        if (mongoose.Types.ObjectId.isValid(_id)) {
            const task = await Task.findOneAndDelete({ _id, owner: req.user._id })

            if(!task) {
                return res.status(404).send()
            }

            res.send(task)
        } else {
            res.status(400).send({
                'error':'Invalid Task Id'
            })
        }
    } catch (error) {
        res.status(500).send(error)
    }
})


module.exports = router