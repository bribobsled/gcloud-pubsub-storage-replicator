"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSchema = void 0;
const pubsub_1 = require("@google-cloud/pubsub");
const storage_1 = require("@google-cloud/storage");
const zod_1 = require("zod");
const pubsub = new pubsub_1.PubSub();
const storage = new storage_1.Storage();
async function sendCopytoBucket(srcBucketName, srcFileName, destBucketName, destFileName) {
    try {
        await storage.bucket(srcBucketName).file(srcFileName).copy(storage.bucket(destBucketName).file(destFileName));
    }
    catch (error) {
        console.log(`error uploading copy of file ${srcFileName} to bucket ${destBucketName}`);
    }
}
async function sendMessage(message) {
    try {
        const topic = pubsub.topic("brianas-replicator-topic");
        const messageId = await topic.publish(Buffer.from(message));
        console.log(`Posted upload message to topic with ID:${messageId}`);
    }
    catch (error) {
        console.log(`Error posting message: ${error.message}`);
    }
}
exports.FileSchema = zod_1.z.object({
    name: zod_1.z.string(),
    bucket: zod_1.z.string()
});
exports.fileReplicator = (fileData, context) => {
    try {
        const file = exports.FileSchema.parse(fileData);
        const eventMessage = context.eventType;
        console.log(`file name: ${file.name}`);
        console.log(`file srcBucket: ${file.bucket}`);
        sendMessage(eventMessage);
        sendCopytoBucket(file.bucket, file.name, "bk_replicator_bucket", file.name);
    }
    catch (error) {
        console.log(`Error replicating file: ${error?.message}`);
    }
};
