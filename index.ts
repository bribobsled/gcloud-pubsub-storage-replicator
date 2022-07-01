
import type { Context } from "@google-cloud/functions-framework/build/src/functions";

import { PubSub } from '@google-cloud/pubsub';
import { Storage } from '@google-cloud/storage';
import {z} from 'zod'; 

const pubsub = new PubSub();

const storage = new Storage();


  async function sendCopytoBucket(srcBucketName:string, srcFileName:string, destBucketName:string, destFileName:string){
      try{
        await storage.bucket(srcBucketName).file(srcFileName).copy(storage.bucket(destBucketName).file(destFileName));
        console.log(`Uploaded copy of file ${srcFileName} to bucket ${destBucketName}`)

      }catch(error){
        console.log(`error uploading copy of file ${srcFileName} to bucket ${destBucketName}`)
      }
    }



  async function sendMessage(message:string){
    try{
      const topic = pubsub.topic("brianas-replicator-topic");

      const messageId = await topic.publish(Buffer.from(message));
      console.log(`Posted upload message to topic with ID:${messageId}`)
    }
    catch(error: any){
      console.log(`Error posting message: ${error.message}`)
    }
      
   }
   
   export const FileSchema = z.object({
      name: z.string(),
      bucket: z.string()
   });
   export type File = z.infer<typeof FileSchema>;




exports.fileReplicator = (fileData: any, context: Context) => {
    try {
      const file = FileSchema.parse(fileData); 

      const eventMessage = context.eventType as string;
      console.log(`file name: ${file.name}`)
      console.log(`file srcBucket: ${file.bucket}`)

      
      sendMessage(eventMessage);
      sendCopytoBucket(file.bucket, file.name, "bk_replicator_bucket", file.name)       
    }
    catch (error: any){
      console.log(`Error replicating file: ${error?.message}`)
    }
  };



