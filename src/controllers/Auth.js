const db = require('../db')
const status = require('../scripts/utils/status')
const AuthHelpers = require('../scripts/helpers/AuthHelpers')


const LoginUser = async(req, res) => {
    const { username, password } = req.body
    console.log(req.body)
    const getUser = `SELECT user_guid, user_name, user_password, is_disabled, is_superuser FROM tbl_users WHERE user_name = $1`;
    const getUserPassword =  `SELECT user_password FROM tbl_users WHERE user_name = $1`

    try {
      const data = await db.query(getUser, [username]);
      const user = data?.rows[0]
      console.log('user',user)
      if (!user || user === undefined) {
        return res.status(status.bad).send("No user with this name or incorrect username");
      } 
      if(user.is_disabled === true){
        return res.status(status.forbidden).send('This user is disabled!')
      }
      
      const {rows} = await db.query(getUserPassword, [user?.user_name])
      if(rows[0].user_password !== ''){
          if(!password){
            return res.status(status.notfound).send('Password is required for this user!')
          }
          const isSamePassword = await AuthHelpers.ComparePassword(password, user.user_password)
          if(!isSamePassword){
            return res.status(status.unauthorized).send('Password is not correct!')
          }

      }

      const access_token = await AuthHelpers.GenerateAccessToken(user)
      const refresh_token = await AuthHelpers.GenerateRefreshToken(user)

      delete user.user_password
      return res.status(status.success).send({
        data: user,
        access_token: access_token,
        refresh_token,
      })

    } catch (error) {
      console.log(error);
      return res.status(status.error).send("Login wasn't successfully")
    }

}




const TokenRefresh = async (req, res) => {
    let token = req.headers.authorization;
    if (!token) {
        return res.status(status.bad).send('Token not provided');
    }
    token = token?.replace("Bearer ", "");
    const verified = await AuthHelpers.VerifyRefreshToken(token);
    if(verified.status === 'Unauthorized' || verified.status === 'Bad'){
      return res.status(status.unauthorized).send('Authentication Failed');
    }
    return res.status(status.success).send(verified.data);
  }
  
  
  const LoadUser = async (req, res) => {
    let authorization = req.headers.authorization;
    try {
      if (!authorization) {
        return res.status(status.unauthorized).send('Token Not Provided');
      }
    let authorization_array = authorization.split(' ');
    let token = '';
    for(let i = 0; i < authorization_array.length; i++){
      if(authorization_array[i] === 'Bearer'){
        token = authorization_array[i+1];
        break;
      }
    }

    if(token === ''){
      return res.status(status.unauthorized).send('Token Not Provided');
    }else{
      const verified = await AuthHelpers.VerifyRefreshToken(token);
      if(verified.status === 'Unauthorized' || verified.status === 'Bad'){
        return res.status(status.unauthorized).send('Unauthorized');
      }else{
        return res.status(status.success).send({
          user: verified.data.user,
          access_token: verified.data.access_token
        });
      }
    }
  } catch (error) {
    console.log('ERROR: ', error)
    res.status(status.error).send('Unknown error')
   }
  }
  

  






module.exports = {
    LoginUser,
    LoadUser, 
    TokenRefresh
}
