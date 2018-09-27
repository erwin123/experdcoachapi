'use strict';

module.exports = function (Report) {

  var cons = require('consolidate');
  var conversion = require("phantom-html-to-pdf")();
  var moment = require('moment');
  require('moment-precise-range-plugin');

  Report.remoteMethod('overall', {
    accepts: [],
    http: {
      path: '/overall',
      verb: 'get'
    }
  });

  Report.overall = function (cb) {

    let Employee = Report.app.models.Employee;
    Employee.find({
      include: {
        relation: 'employeeTasks',
        scope: {
          where: {
            isDone: 1
          }
        }
      }
    })
      .then(employees => {
        let listEmployees = employees.filter(employee => employee.employeeTasks().length)
        for (let employee of listEmployees) {
          let count = 0;
          let totalOverall = 0;
          for (let task of employee.employeeTasks()) {
            count++;
            totalOverall += task.Rating;
          }
          employee.updateAttribute('overallRate', Math.round(totalOverall / count))
        }
        return cb(null, listEmployees)
      })

  }

  Report.remoteMethod('download', {
    accepts: [
      { arg: 'company', type: 'number' },
      { arg: 'res', type: 'object', 'http': { source: 'res' } }
    ],
    http: {
      path: '/download',
      verb: 'get'
    }
  });

  Report.download = function (company, res, cb) {

    if (!company) {
      res.status(401).json({
        "error": "Please choose Company"
      });
      abort();
    }
    let Company = Report.app.models.Company;
    Company
      .findOne({
        where: {
          id: company,
        },
        include: ['competences']
      })
      .then(myCompany => {

        if (!myCompany) {
          res.status(401).json({
            "error": "Company not found"
          });
          abort();
        }

        let Employee = Report.app.models.Employee;
        Employee.find({
          where: {
            companyId: company,
          },
          counts: "team",
          include: [{
            relation: 'employeeProfileHistories',
            scope: {
              order: 'date DESC',
              // limit: 1,
              include: 'profile'
            }
          }, {
            relation: 'team',
            scope: {
              counts: "team",
              include: [{
                relation: 'employeeProfileHistories',
                scope: {
                  order: 'date DESC',
                  limit: 1,
                  include: 'profile'
                }
              }, {
                relation: 'employeeTasks',
                scope: {
                  include: ['employeeTaskDevelopments', 'assignedBy', 'competence', 'employeeTaskSupervisor']
                }
              }, {
                relation: 'employeeCompetence',
                scope: {
                  include: ['competence']
                }
              }, {
                relation: 'employeeCompetenceTarget',
                scope: {
                  include: ['competence']
                }
              }, {
                relation: 'competenceSet',
                scope: {
                  include: ['competenceLevels']
                }
              }, 'competences', 'team', 'assignedBy']
            }
          }, {
            relation: 'employeeCompetence',
            scope: {
              include: ['competence']
            }
          }, {
            relation: 'employeeCompetenceTarget',
            scope: {
              include: ['competence']
            }
          }, {
            relation: 'competenceSet',
            scope: {
              include: ['competenceLevels']
            }
          }, 'employeeTasks', 'supervisor', 'assignedBy']
        })
          .then(response => {
            // console.log(response);

            if (response.length === 0) {
              res.status(401).json({
                "error": "No Employees in this Company"
              });
              abort();
            }

            let employees = [];
            let employeesTotals = {
              taskOnGoing: 0,
              taskFinish: 0,
              teamCount: 0,
              taskCreate: 0,
            }
            let employeeCoachReport = []

            let demographicReport = {
              totalCoach: 0,
              coachStatistic: {
                sex: [],
                level: [],
                division: []
              },
              totalCoachee: 0,
              coacheeStatistic: {
                sex: [],
                level: [],
                division: []
              },
              totalTask: 0,
              taskStatistic: [{
                "type": "Task On Going",
                "total": 0
              }, {
                "type": "Task Finished",
                "total": 0
              }],
            }

            for (let employee of response) {

              // Get Member Competences

              let employeeCompetence = []

              if (myCompany.competences().length) {
                for (let competence of myCompany.competences()) {
                  employeeCompetence.push({
                    name: competence.name,
                    definition: competence.definition,
                    keybehaviour: competence.keybehaviour,
                    id: competence.id,
                    value: 0,
                    target: 0,
                    completedBefore: 0
                  });
                }
              }

              if (employee.employeeCompetenceTarget().length) {
                for (let competence of employee.employeeCompetenceTarget()) {
                  let myComp = employeeCompetence.find(value => value.id === competence.competenceId);
                  if (myComp) { myComp.target = competence.target; };
                }
              }

              if (employee.employeeCompetence().length) {
                for (let competence of employee.employeeCompetence()) {
                  let myComp = employeeCompetence.find(value => value.id === competence.competenceId);
                  if (myComp) {
                    myComp.value = competence.value;
                    myComp.completedBefore = competence.oldValue ? competence.oldValue : 0;
                  };
                }
              }

              if (employee.competenceSet()) {
                if (employee.competenceSet().competenceLevels().length) {
                  for (let competence of employee.competenceSet().competenceLevels()) {
                    let myComp = employeeCompetence.find(value => value.id === competence.competenceId);
                    if (myComp) { myComp.target = competence.level; };
                  }
                }
              }

              // Code to check for the Competences
              for (let competence of employeeCompetence) {
                competence.print = competence.target - competence.value;
              }

              const employeeCompetenceTemp = employeeCompetence.filter(competence => competence.value > 0 || competence.target > 0);

              let employeeCompetence1 = employeeCompetenceTemp.filter((elem, i, array) => i >= employeeCompetenceTemp.length / 2);
              let employeeCompetence2 = employeeCompetenceTemp.filter((elem, i, array) => i < employeeCompetenceTemp.length / 2);

              employeeCompetence = employeeCompetence;
              employeeCompetence1 = employeeCompetence1;
              employeeCompetence2 = employeeCompetence2;
              // End

              // Demographic Data

              // Dia adalah Coachee
              if (employee.supervisor().length) {
                demographicReport.totalCoachee++;

                let statCoacheeSex = demographicReport.coacheeStatistic.sex.find(value => value.type === employee.sex);
                if (statCoacheeSex) {
                  statCoacheeSex.total++;
                } else {
                  demographicReport.coacheeStatistic.sex.push({
                    "type": employee.sex,
                    "total": 1
                  })
                }

                // let statCoacheeLevel = demographicReport.coacheeStatistic.level.find(value => value.type === employee.sex);
                // if (statCoacheeLevel) {
                //   statCoacheeLevel.total++;
                // } else {
                //   demographicReport.coacheeStatistic.level.push({
                //     "type": employee.sex,
                //     "total": 1
                //   })
                // }

                let statCoacheeDivision = demographicReport.coacheeStatistic.division.find(value => value.type === employee.division);
                if (statCoacheeDivision) {
                  statCoacheeDivision.total++;
                } else {
                  demographicReport.coacheeStatistic.division.push({
                    "type": employee.division,
                    "total": 1
                  })
                }
              }

              // Dia adalah Coach
              if (employee.team().length) {
                demographicReport.totalCoach++;

                let statCoachSex = demographicReport.coachStatistic.sex.find(value => value.type === employee.sex);
                if (statCoachSex) {
                  statCoachSex.total++;
                } else {
                  demographicReport.coachStatistic.sex.push({
                    "type": employee.sex,
                    "total": 1
                  })
                }

                // let statCoachLevel = demographicReport.coachStatistic.level.find(value => value.type === employee.sex);
                // if (statCoachLevel) {
                //   statCoachLevel.total++;
                // } else {
                //   demographicReport.coachStatistic.level.push({
                //     "type": employee.sex,
                //     "total": 1
                //   })
                // }

                let statCoachDivision = demographicReport.coachStatistic.division.find(value => value.type === employee.division);
                if (statCoachDivision) {
                  statCoachDivision.total++;
                } else {
                  demographicReport.coachStatistic.division.push({
                    "type": employee.division,
                    "total": 1
                  })
                }
              }

              let thisEmployee = {
                name: employee.name,
                division: employee.division,
                position: employee.position,
                profile: getProfile(employee.employeeProfileHistories(), 'stamp'),
                profileDesc: getProfile(employee.employeeProfileHistories(), 'description'),
                taskOnGoing: employee.employeeTasks().filter(value => !value.isDone).length,
                taskFinish: employee.employeeTasks().filter(value => value.isDone).length,
                teamCount: employee.team().length,
                taskCreate: employee.assignedBy().length,
                dob: moment(employee.dob).isValid() ? moment().diff(employee.dob, 'years') + 'yo' : '-',
                sex: employee.sex,
                supervisors: getSupervisor(employee.supervisor()),
                overall: +employee.overallRate,
                joinMoment: checkJoinDate(employee.joinDate),
                company: myCompany.name,
                employeeCompetence: employeeCompetence,
                employeeCompetence1: employeeCompetence1,
                employeeCompetence2: employeeCompetence2
              }
              employees.push(thisEmployee)

              // Get Team Member Data
              if (employee.team().length) {

                let team = []

                for (let teamMember of employee.team()) {

                  let teammemberCompetence = []

                  if (myCompany.competences().length) {
                    for (let competence of myCompany.competences()) {
                      teammemberCompetence.push({
                        name: competence.name,
                        definition: competence.definition,
                        keybehaviour: competence.keybehaviour,
                        id: competence.id,
                        value: 0,
                        target: 0,
                        completedBefore: 0
                      });
                    }
                  }

                  if (teamMember.employeeCompetenceTarget().length) {
                    for (let competence of teamMember.employeeCompetenceTarget()) {
                      let myComp = teammemberCompetence.find(value => value.id === competence.competenceId);
                      if (myComp) { myComp.target = competence.target; };
                    }
                  }

                  if (teamMember.employeeCompetence().length) {
                    for (let competence of teamMember.employeeCompetence()) {
                      let myComp = teammemberCompetence.find(value => value.id === competence.competenceId);
                      if (myComp) {
                        myComp.value = competence.value;
                        myComp.completedBefore = competence.oldValue ? competence.oldValue : 0;
                      };
                    }
                  }

                  if (teamMember.competenceSet()) {
                    if (teamMember.competenceSet().competenceLevels().length) {
                      for (let competence of teamMember.competenceSet().competenceLevels()) {
                        let myComp = teammemberCompetence.find(value => value.id === competence.competenceId);
                        if (myComp) { myComp.target = competence.level; };
                      }
                    }
                  }

                  // Code to check for the Competences
                  for (let competence of teammemberCompetence) {
                    competence.print = competence.target - competence.value;
                  }

                  const teammemberCompetenceTemp = teammemberCompetence.filter(competence => competence.value > 0 || competence.target > 0);

                  let teammemberCompetence1 = teammemberCompetenceTemp.filter((elem, i, array) => i >= teammemberCompetenceTemp.length / 2);
                  let teammemberCompetence2 = teammemberCompetenceTemp.filter((elem, i, array) => i < teammemberCompetenceTemp.length / 2);

                  // We need to do a partition on taskOnGoing and taskFinish for cochee

                  // Get the taskOnGoing and taskFinish
                  let taskOnGoing = teamMember.employeeTasks().filter(value => !value.isDone);
                  let taskFinish = teamMember.employeeTasks().filter(value => value.isDone);

                  let taskList = [];

                  let tempTaskOnGoing = [];
                  let tempTaskFinish = [];
                  let counter = 0;
                  let index = 0;


                  for (let task of taskOnGoing) {
                    tempTaskOnGoing.push(task);
                    ++counter; ++index;
                    if (counter > 1 || index === taskOnGoing.length) {
                      taskList.push({
                        taskOnGoing: tempTaskOnGoing,
                        taskFinish: []
                      })
                      tempTaskOnGoing = []
                      counter = 0;
                    }
                  }

                  index = 0;

                  for (let task of taskFinish) {
                    tempTaskFinish.push(task);
                    ++counter; ++index;
                    if (counter > 1 || index === taskFinish.length) {
                      taskList.push({
                        taskOnGoing: [],
                        taskFinish: tempTaskFinish
                      })
                      tempTaskFinish = []
                      counter = 0;
                    }
                  }

                  let thisTeamMember = {
                    name: teamMember.name,
                    division: teamMember.division,
                    position: teamMember.position,
                    profile: getProfile(teamMember.employeeProfileHistories(), 'stamp'),
                    profileDesc: getProfile(teamMember.employeeProfileHistories(), 'description'),
                    taskOnGoing: taskOnGoing.length,
                    taskFinish: taskFinish.length,
                    taskList: taskList,
                    teamCount: teamMember.team().length,
                    taskCreate: teamMember.assignedBy().length,
                    dob: moment(teamMember.dob).isValid() ? moment().diff(teamMember.dob, 'years') + 'yo' : '-',
                    sex: teamMember.sex,
                    // supervisors: getSupervisor(teamMember.supervisor()),
                    overall: +teamMember.overallRate,
                    joinMoment: checkJoinDate(teamMember.joinDate),
                    company: myCompany.name,
                    teammemberCompetence: teammemberCompetence,
                    teammemberCompetence2: teammemberCompetence2,
                    teammemberCompetence1: teammemberCompetence1
                  }
                  if(thisTeamMember.overall >0)
                    team.push(thisTeamMember)
                }

                let count = 0;
                let totalOverall = 0;
                for (let item of team) {
                  count++;
                  totalOverall += item.overall;
                }

                employeeCoachReport.push({
                  coach: thisEmployee,
                  averageOverall: Math.round(totalOverall / count),
                  coachee: team
                })
              }
            }

            for (let employee of employees) {
              employeesTotals.taskOnGoing = employeesTotals.taskOnGoing + parseInt(employee.taskOnGoing)
              employeesTotals.taskFinish = employeesTotals.taskFinish + parseInt(employee.taskFinish)
              employeesTotals.teamCount = employeesTotals.teamCount + parseInt(employee.teamCount)
              employeesTotals.taskCreate = employeesTotals.taskCreate + parseInt(employee.taskCreate)
            }

            demographicReport.totalTask = employeesTotals.taskOnGoing + employeesTotals.taskFinish;

            let statTaskOnGoing = demographicReport.taskStatistic.find(value => value.type === "Task On Going");
            if (statTaskOnGoing) { statTaskOnGoing.total = employeesTotals.taskOnGoing; };

            let statTaskFinish = demographicReport.taskStatistic.find(value => value.type === "Task Finished");
            if (statTaskFinish) { statTaskFinish.total = employeesTotals.taskFinish; };

            function getProfile(myProfile, type) {
              if (myProfile.length) {
                if (type == 'stamp') {
                  return myProfile[0].profileStamp;
                } else {
                  return myProfile[0].profile().description;
                }
              } else {
                return '-';
              }
            }

            function getSupervisor(mySupervisors) {
              let retSPV = [];
              for (let supervisor of mySupervisors) {
                retSPV.push(supervisor.name);
              }
              return retSPV;
            }

            function checkJoinDate(joindate) {
              if (!moment(joindate).isValid()) {
                return '-';
              }

              let starts = moment(joindate);
              let ends = moment();

              let diff = moment.preciseDiff(starts, ends, true);
              let diffHuman = diff.years + ' Years,' + diff.months + ' Months,' + diff.days + ' Days'
              return diffHuman;
            }

            // employee overview list
            let overviewEmployeeList = [];
            let tempEmployeeList = [];
            let counter = 0;
            let index = 0;
            for (let employee of employees) {
              tempEmployeeList.push(employee)
              counter++; index++;
              if (counter > 30 || index === employees.length) {
                overviewEmployeeList.push(tempEmployeeList)
                tempEmployeeList = []
                counter = 0;
              }
            }

            cons.pug('server/views/report.pug', {
              reportMonth: moment().format("MMMM YYYY"),
              companyProfile: myCompany.profile,
              employees: employees,
              overviewEmployeeList: overviewEmployeeList,
              employeesTotals: employeesTotals,
              employeeCoachReport: employeeCoachReport,
              competences: myCompany.competences(),
              demographicReport: demographicReport,
              moment: require('moment'),
              columns: [{
                name: 'name',
                title: 'Name',
                classes: ['experd-color'],
                hasRouter: true
              }, {
                name: 'division',
                title: 'Division',
                classes: ['white']
              }, {
                name: 'position',
                title: 'Position',
                classes: ['white']
              }, {
                name: 'profile',
                title: 'Profile',
                classes: ['white']
              }, {
                name: 'taskOnGoing',
                title: 'Task On Going',
                classes: ['white']
              }, {
                name: 'taskFinish',
                title: 'Task Finish',
                classes: ['white']
              }, {
                name: 'teamCount',
                title: 'Team',
                classes: ['white']
              }, {
                name: 'taskCreate',
                title: 'Create Task',
                classes: ['white']
              }, {
                name: 'dob',
                title: 'Age',
                classes: ['white']
              }, {
                name: 'sex',
                title: 'Sex',
                classes: ['white']
              }, {
                name: 'coach',
                title: 'Coach',
                classes: ['experd-color']
              }, {
                name: 'overall',
                title: 'Overall Rate',
                classes: ['white']
              }]
            })
              .then(function (html) {

                conversion(
                  {
                    html: html,
                    paperSize: {
                      format: 'A4',
                      orientation: 'portrait',
                      margin: "0cm",
                      headerHeight: "0cm",
                      
                    },
                    // fitToPage: true,
                  }, function (err, pdf) {
                    console.log(pdf.logs);
                    console.log(pdf.numberOfPages);
                    res.setHeader('content-type', 'application/pdf');
                    pdf.stream.pipe(res);
                  });

              })
              .catch(function (err) {
                res.status(401).json({
                  "error": "error"
                });
              });

          })
          .catch(function (err) {
            res.status(401).json({
              "error": "error"
            });
          })

      })
      .catch(function (err) {
        res.status(401).json({
          "error": "error"
        });
      })



  }

};
