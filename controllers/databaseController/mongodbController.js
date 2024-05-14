const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Plant = require('./models/Plant');
const ChatRecord=require('./models/chatRecord');
// mongodbcontroller.js
const UpdateRequest = require('./models/updateRequest');

// var app = express();
// app.use(express.json());

// MongoDB connection string
const uri = "mongodb+srv://web04Admin:project-22558800@web04.mongocluster.cosmos.azure.com/web04?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000";

// Connect to MongoDB using Mongoose
mongoose.connect(uri);

// callback
mongoose.connection.on("open", async () => {

    // call back of connect success
    console.log("MongoDb connect success");
    try {
        await UpdateRequest.ensureIndexes(); // 确保所有在模型上定义的索引被创建
        console.log("Indexes ensured successfully");
    } catch (err) {
        console.log("Error ensuring indexes:", err);
    }
});
mongoose.connection.on("error", () => {
    // call back of error
    console.log("MongoDb connect fail");
});
mongoose.connection.on("close", () => {
    // call back of db close
    console.log("MongoDb connection is closed");
});


// function createPlantId(plantName) {
//     const now = new Date();
//     return `${plantName}${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;;
// }

async function addPlant(plantId,
                        plantName,
                        description,
                        details,
                        datetime,
                        lat,
                        lng,
                        flowers,
                        sunExposure,
                        flowerColor,
                        status,
                        nickName,
                        photo,
                        DBpediaLink,
                        DBpediaName,
                        DBpediaDescription,
                        DBpediaGunes)
{
    const now = new Date();
    // const plantId = createPlantId(plantName);
    let dbpedia = {};
    dbpedia.link = DBpediaLink;
    dbpedia.name = DBpediaName;
    dbpedia.description = DBpediaDescription;
    dbpedia.genus = DBpediaGunes;
    let location = {};
    location.lat=lat;
    location.lng=lng;
    var response;
    try {
        const newPlant = new Plant({
            plantId,
            plantName,
            description,
            details,
            datetime,
            location,
            flowers,
            sunExposure,
            flowerColor,
            status,
            nickName,
            photo,
            dbpedia
        });
        await newPlant.save();
        // response={'type':'success','content':plantId};
        response={'type':'success','content':newPlant};
    } catch (error) {
        response={'type':'fail','content':error.message};
    }
    return response;
}


async function getPlant(id) {
    try {
        const plantInfo = await Plant.findOne({plantId: id});
        // console.log(plantInfo)
        var response;
        if (plantInfo) {
            response={'type':'success','content':plantInfo};
        } else {
            response={'type':'fail','content':'plant cannot find'};
        }
    } catch (error) {
        response={'type':'fail','content':error.message};
    }
    return response;
}


async function getAllPlants(){
    var response;
    try {
        const plants = await Plant.find({});
        response={'type':'success','content':plants};
    } catch (error) {
        response={'type':'fail','content':error.message};
    }
    return response;
}


async function getNickNameOfPlant(id) {
    // Declare response at the start of the function
    let response = {
        type: 'fail',
        content: 'Unexpected error occurred'
    };

    try {
        // Query the plant record with the specified plantId
        const plantInfo = await Plant.findOne({ plantId: id });

        // If the plant information is found, return its nickname
        if (plantInfo) {
            response = {
                type: 'success',
                content: plantInfo.nickName
            };
        } else {
            // No matching plant record found
            response = {
                type: 'fail',
                content: 'Plant not found'
            };
        }
    } catch (error) {
        // Catch errors and return the error message
        response = {
            type: 'fail',
            content: error.message
        };
    }

    // Return the response
    return response;
}


async function changePlantNameOfPlant(id, newPlantName,link,name,description,genus) {
    let response;
    try {
        const dbpedia={}
        dbpedia.link = link;
        dbpedia.name = name;
        dbpedia.description = description;
        dbpedia.genus = genus;
        // Update the plant name for the plant with the specified plantId
        const plantInfo = await Plant.findOneAndUpdate(
            { plantId: id }, // Find the plant by plantId
            { plantName: newPlantName ,dbpedia: dbpedia}, // Set the new plant name
            { new: true } // Return the updated document
        );

        // If the update was successful, return a success message
        if (plantInfo) {
            response = {
                type: 'success',
                content: `Plant name updated to '${newPlantName}'`
            };
        } else {
            // If no matching plant record was found
            response = {
                type: 'fail',
                content: 'Plant not found'
            };
        }
    } catch (error) {
        // Catch any errors and return an appropriate message
        response = {
            type: 'fail',
            content: error.message
        };
    }
    // Return the response
    return response;
}

async function findPlantByObjId(id) {
    try {
        // 确保 id 是一个有效的 ObjectId
        const objectId = new mongoose.Types.ObjectId(id);
        const plant = await Plant.findById(objectId);
        if (!plant) {
            return { type: 'fail', content: 'Plant not found' };
        }
        return { type: 'success', content: plant };
    } catch (error) {
        return { type: 'fail', content: error.message };
    }
}

async function changePlantNameOfPlantForCreator(id, updateFields) {
    let response;
    try {
        const objectId = new mongoose.Types.ObjectId(id);
        // 更新植物记录
        const result = await Plant.findByIdAndUpdate(
            objectId,
            updateFields,
            { new: true }
        );

        if (result) {
            response = {
                type: 'success',
                content: 'Plant name and status updated successfully'
            };
        } else {
            response = {
                type: 'fail',
                content: 'Failed to update plant'
            };
        }
    } catch (error) {
        response = {
            type: 'fail',
            content: error.message
        };
    }

    return response;
}

async function addChatRecord(plantId,nickName,content,date){

    var response;
    // const now = new Date();
    const newChat = {
        nickName: nickName,
        content: content,
        date: date // 如果不指定日期，默认使用当前时间
    };
    try {
        const result = await ChatRecord.findOneAndUpdate(
            { plantId: plantId }, // 查询条件
            { $push: { chatList: newChat } }, // 要添加的聊天数据
            { new: true, upsert: true } // 选项: 返回更新后的文档，并在找不到时创建新文档
        );
        // console.log('Updated Chat Record:', result);
        if(result){
            response={'type':'success','content':''};
        }
        else{
            response={'type':'fail','content':'Cannot update chat record'};
        }
    } catch (error) {
        response={'type':'fail','content':error.message};
    }
    return response;
}

async function getChatRecord(plantId) {
    var response;
    try {
        const chatRecords = await ChatRecord.findOne({ plantId: plantId });
        if (chatRecords.chatList.length > 0) {
            response = {'type': 'success', 'content': chatRecords};
        } else {
            response = {'type': 'fail', 'content': 'No chat records found for this plant'};
        }
    } catch (error) {
        response = {'type': 'fail', 'content': error.message};
    }
    return response;
}

async function getAllChatRecord(){
    var response;
    try {
        const allChat = await ChatRecord.find({});
        response={'type':'success','content':allChat};
    } catch (error) {
        response={'type':'fail','content':error.message};
    }
    return response;
}

// Add or update plant edit request (plantId, plantName, nickName)
async function addUpdateRequest(plantId,
                                plantName,
                                nickName,
                                creator,
                                plantOriginalName) {
    var response;
    try {
        const updateRequest = new UpdateRequest({  plantId,
                                                                                        plantName,
                                                                                        nickName,
                                                                                        creator,
                                                                                        plantOriginalName});
        await updateRequest.save();
        response = { type: 'success', content: '' };
    } catch (error) {
        // Check if the error is a duplicate key error
        // console.log(error.name);
        if (error.code === 11000) {
            // Provide a custom message for duplicate key error
            response = { type: 'fail', content: 'This suggestion has already been submitted by someone.' };
        } else {
            // Handle other kinds of errors normally
            response = { type: 'fail', content: 'Error processing request: ' + error.message };
        }
    }
    return response;
}



// Get plant edit request by plantId
async function getUpdateRequestById(plantId) {
    var response;
    try {
        const updateRequest = await UpdateRequest.findOne({ plantId });
        if (updateRequest) {
            response = { type: 'success', content: updateRequest };
        } else {
            response = { type: 'fail', content: 'No update request found for this plant' };
        }
    } catch (error) {
        response = { type: 'fail', content: error.message };
    }
    return response;
}

// Get all plant edit requests
async function getAllUpdateRequests() {
    var response;
    try {
        const allRequests = await UpdateRequest.find({});
        response = { type: 'success', content: allRequests };
    } catch (error) {
        response = { type: 'fail', content: error.message };
    }
    return response;
}

// Update plant edit request's approval status


// async function getAllUpdateRequestsByNickName(creator) {
//     let response;
//     try {
//         const updateRequests = await UpdateRequest.find({ creator });
//         response = { 'type': 'success', 'content': updateRequests };
//     } catch (error) {
//         response = { 'type': 'fail', 'content': error.message };
//     }
//     return response;
// }

async function getAllUpdateRequestsByNickName(creator) {
    let response;
    try {
        const updateRequests = await UpdateRequest.aggregate([
            { $match: { creator: creator } },  // 过滤匹配的文档
            { $sort: { statusOfRequest: -1, date: -1, plantName: 1 } },// 根据新字段和其他字段排序
            { $project: { sortPriority: 0 } }  // 选择性地移除用于排序的临时字段
        ]);
        response = { 'type': 'success', 'content': updateRequests };
    } catch (error) {
        response = { 'type': 'fail', 'content': error.message };
    }
    return response;
}


async function updateRequestFromUrPage(plantId, plantName, date, decision, nickName) {
    try {
        const result = await UpdateRequest.findOneAndUpdate(
            {
                plantId: plantId,
                date: date,
                nickName: nickName
            },
            {
                statusOfRequest: 'completed',
                decision: decision
            },
            {
                new: true // Return the updated document
            }
        );

        if (!result) {
            throw new Error('No matching document found to update.');
        }

        return result;
    } catch (error) {
        console.error('Failed to update request:', error);
        throw error; // Rethrow or handle as needed
    }
}

// Export the function
module.exports = { addPlant, getPlant, getAllPlants, getNickNameOfPlant, changePlantNameOfPlant, addChatRecord,getChatRecord,getAllChatRecord, addUpdateRequest, getUpdateRequestById, getUpdateRequestById,
    getAllUpdateRequests, getAllUpdateRequestsByNickName, updateRequestFromUrPage, changePlantNameOfPlantForCreator, findPlantByObjId};

