var server = require('./server');
var ds = server.dataSources.db;
var lbTables = ["AccessToken", "ACL", "RoleMapping", "Role", "company", "employee", "employeeCoachData", "profile", "profileTest", "profileTestChoice", "employeeProfileHistory", "employeeProfileHistoryTest", "competence", "competenceLevel", "competenceSet", "competenceSetDetail", "employeeCompetence", "employeeTask", "employeeTaskSupervisor", "employeeTaskDevelopment", "companycompetence", "employeeTeam", "employeeSupervisor", ];
ds.automigrate(lbTables, function (er) {
  if (er) throw er;
  console.log('Loopback tables [' + lbTables + '] created in ', ds.adapter.name);
  ds.disconnect();
});
