const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const dynamoDB = require("./dynamo");

// Create a new task
router.post("/", async (req, res) => {
    try {
        const { title, description } = req.body;
        
        // Add validation
        if (!title || !description) {
            return res.status(400).json({ 
                error: "Title and description are required" 
            });
        }

        const task = {
            id: uuidv4(),
            title,
            description,
            completed: false,
            createdAt: new Date().toISOString()
        };

        await dynamoDB.put({
            TableName: process.env.DYNAMODB_TABLE,
            Item: task
        });

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not create task" });
    }
});

// Get all tasks
router.get("/", async (req, res) => {
    try {
        const result = await dynamoDB.scan({
            TableName: process.env.DYNAMODB_TABLE
        });
        res.json(result.Items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not retrieve tasks" });
    }
});

// Get a single task
router.get("/:id", async (req, res) => {
    try {
        const result = await dynamoDB.get({
            TableName: process.env.DYNAMODB_TABLE,
            Key: {
                id: req.params.id
            }
        });
        
        if (!result.Item) {
            return res.status(404).json({ error: "Task not found" });
        }
        
        res.json(result.Item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not retrieve task" });
    }
});

// Update a task
router.put("/:id", async (req, res) => {
    try {
        const { title, description, completed } = req.body;
        const result = await dynamoDB.update({
            TableName: process.env.DYNAMODB_TABLE,
            Key: {
                id: req.params.id
            },
            UpdateExpression: "set title = :title, description = :description, completed = :completed",
            ExpressionAttributeValues: {
                ":title": title,
                ":description": description,
                ":completed": completed
            },
            ReturnValues: "ALL_NEW"
        });
        
        res.json(result.Attributes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not update task" });
    }
});

// Delete a task
router.delete("/:id", async (req, res) => {
    try {
        await dynamoDB.delete({
            TableName: process.env.DYNAMODB_TABLE,
            Key: {
                id: req.params.id
            }
        });
        
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not delete task" });
    }
});

module.exports = router;