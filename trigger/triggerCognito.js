

const cognitoHandler = async(event,context) => {

    console.log(event.request.userAttributes)




    return event

}
exports.main = cognitoHandler
