const crypto = require("@aws-crypto/client-node");
const { encrypt, decrypt } = crypto.buildClient(
    crypto.CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT
)

const generatorKeyId = process.env.arnKmsAlias;

/* Adding alternate KMS keys that can decrypt.
 * Access to kms:Encrypt is required for every CMK in keyIds.
 * You might list several keys in different AWS Regions.
 * This allows you to decrypt the data in any of the represented Regions.
 * In this example, I am using the same CMK.
 * This is *only* to demonstrate how the CMK ARNs are configured.
 */
const keyIds = [
    process.env.arnKms
]



exports.encrypt = async (dataToEncrypt) => {


    if (process.env.ISLOCAL=="true")
    {
        console.log("simulateEncrypt");

        return Buffer.from(JSON.stringify(dataToEncrypt)).toString('base64');

    }
    else {
        const keyring = new crypto.KmsKeyringNode({generatorKeyId, keyIds})

        /* Encryption context is a *very* powerful tool for controlling and managing access.
         * It is ***not*** secret!
         * Encrypted data is opaque.
         * You can use an encryption context to assert things about the encrypted data.
         * Just because you can decrypt something does not mean it is what you expect.
         * For example, if you are are only expecting data from 'us-west-2',
         * the origin can identify a malicious actor.
         * See: https://docs.aws.amazon.com/encryption-sdk/latest/developer-guide/concepts.html#encryption-context
         */
        const context = {
            stage: 'test',
            purpose: 'simple demonstration app',
            origin: 'us-east-1',
        }


        const cleartext = JSON.stringify(dataToEncrypt);

        /* Encrypt the data. */
        const {result} = await encrypt(keyring, cleartext, {
            encryptionContext: context,
        })
        const base64Encrypt = result.toString('base64');
        return base64Encrypt;

    }
    }
exports.decrypt = async (base64String) => {

   if (process.env.ISLOCAL=="true")
   {
       console.log("simulate decrypt");

       return Buffer.from(base64String,'base64').toString('utf8');
   }
   else {
       const keyring = new crypto.KmsKeyringNode({generatorKeyId, keyIds})

       const {plaintext, messageHeader} = await decrypt(keyring, Buffer.from(base64String, 'base64'));

       return plaintext.toString('utf8');
   }
}



