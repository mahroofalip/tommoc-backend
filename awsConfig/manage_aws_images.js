const S3 = require('aws-sdk/clients/s3');
const { v4 } = require("uuid");


const bucketName = process.env.AWS_S3_BUCKET_NAME
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY
const region = process.env.AWS_REGION
console.log(bucketName,accessKeyId,secretAccessKey,region);
const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey
})

const uuidv4 = v4;

// uploadImages(image, folder)
module.exports = {

    uploadImages : async(image, folder, ext) => {
        try{     
      var buf = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""),'base64')
      var uploadData = {
        Bucket : bucketName,
        Body : buf,
        ACL : 'public-read',
        Key : `${folder}/${uuidv4()}.${ext}`
      }
      const data = await s3.upload(uploadData).promise()
      return {
        img_url : data.Location,
        img_key : data.Key
      }
        }catch(err){
            console.log(err);
        }
    },


    deleteImages : async (key) => {
        console.log(key);
        const params = {
            Bucket : bucketName,
            Key : key
        }
        s3.deleteObject(params,function (err,data){
            if(err){
                console.log(err);
            }else{
                console.log(data);
                return data
            }
        })
    },
}