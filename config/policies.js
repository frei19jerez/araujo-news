module.exports.policies = {

  AdminController: {
    '*': ['isAdmin']
  }

};