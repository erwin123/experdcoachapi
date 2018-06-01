'use strict';

var _, async, fork, fs, loopback, path, Excel;
_ = require('lodash');
async = require('async');
fork = require('child_process').fork;
fs = require('fs');
path = require('path');
loopback = require('loopback');
Excel = require("exceljs");
var Role = {
  Dirut: 2,
  Direktur: 3,
  Kadiv: 4,
  Wakadiv: 5,
  Kadept: 6,
  Wakadept: 7,
  SPV: 8,
  Koordinator: 9,
  Staff: 10,
  NonStaff: 11
};

module.exports = function (Employee) {

  Employee.upload = function (req, companyId, callback) {
    var Container, FileUpload, containerName;
    Container = Employee.app.models.Container;
    FileUpload = Employee.app.models.FileUpload;

    // Generate a unique name to the container
    containerName = "employee-" + (Math.round(Date.now())) + "-" + (Math.round(Math.random() * 1000));

    // async.waterfall is like a waterfall of functions applied one after the other
    return async.waterfall([
      function (done) {
        // Create the container (the directory where the file will be stored)
        return Container.createContainer({
          name: containerName
        }, done);
      },
      function (container, done) {
        req.params.container = containerName;
        // Upload one or more files into the specified container. The request body must use multipart/form-data which the file input type for HTML uses.
        return Container.upload(req, {}, done);
      },
      function (fileContainer, done) {
        // Store the state of the import process in the database

        return FileUpload.create({
          date: new Date(),
          fileType: Employee.modelName,
          status: 'PENDING'
        }, function (err, fileUpload) {
          return done(err, fileContainer, fileUpload);
        });
      }
    ], function (err, fileContainer, fileUpload) {
      var params;
      if (err) {
        return callback(err);
      }

      params = {
        fileUpload: fileUpload.id,
        root: Employee.app.datasources.container.settings.root,
        container: fileContainer.files.file[0].container,
        file: fileContainer.files.file[0].name,
        companyId: companyId,
        roleid: req.query.roleid
      };
      // Launch a fork node process that will handle the import
      fork(__dirname + '/../../server/scripts/import-employees.js', [JSON.stringify(params)]);
      return callback(null, fileUpload);
    });

  };

  Employee.remoteMethod('upload', {
    accepts: [{
      arg: 'req',
      type: 'object',
      http: {
        source: 'req'
      },
    }, {
      arg: 'companyId',
      type: 'number',
    }],
    returns: [{
      arg: 'fileUpload',
      type: 'any'
    }],
    http: {
      verb: 'post',
      path: '/upload'
    },
  });

  Employee["import"] = function (container, file, options, callback) {
    // Initialize a context object that will hold the transaction
    var ctx;
    ctx = {};

    // The import_preprocess is used to initialize the sql transaction
    return Employee.import_preprocess(ctx, container, file, options, function (err) {
      return Employee.import_process(ctx, container, file, options, function (importError) {
        if (importError) {
          // rollback does not apply the transaction
          return async.waterfall([
            function (done) {
              console.log('Rolling Back');
              return ctx.transaction.rollback(done);
            },
            function (done) {
              // Do some other stuff to clean and acknowledge the end of the import
              return Employee.import_postprocess_error(ctx, container, file, options, done);
            },
            function (done) {
              return Employee.import_clean(ctx, container, file, options, done);
            }
          ], function () {
            return callback(importError);
          });
        } else {
          return async.waterfall([
            function (done) {
              // The commit applies the changes to the database
              return ctx.transaction.commit(done);
            },
            function (done) {
              // Do some other stuff to clean and acknowledge the end of the import
              return Employee.import_postprocess_success(ctx, container, file, options, done);
            },
            function (done) {
              return Employee.import_clean(ctx, container, file, options, done);
            }
          ], function () {
            return callback(null);
          });
        }
      });
    });
  };

  Employee.import_preprocess = function (ctx, container, file, options, callback) {
    // initialize the SQL transaction
    return Employee.beginTransaction({
      isolationLevel: Employee.Transaction.READ_UNCOMMITTED
    }, function (err, transaction) {
      ctx.transaction = transaction;
      return callback(err);
    });
  };

  Employee.import_process = function (ctx, container, file, options, cb) {
    var fileContent, filename, stream;
    fileContent = [];
    filename = path.join(Employee.app.datasources.container.settings.root, container, file);

    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(filename)
      .then(function () {
        var errors, results;
        errors = [];

        var worksheet = workbook.getWorksheet(1);
        results = [];


        return async.series([
          // get the list to iterate over
          callback => {
            worksheet.eachRow({
              includeEmpty: false
            }, function (row, rowNumber) {
              //console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));
              if (rowNumber > 1) results.push({
                line: rowNumber,
                content: JSON.parse(JSON.stringify(row.values))
              });
            });
            callback()
          },
          // loop through every results
          callback => {
            async.forEachSeries(results, (item, done) => {
              // Import the individual line
              return Employee.import_handleLine(ctx, item, options, err => {
                if (err) {
                  errors.push(err);
                  // If an error is raised on a particular line, store it with the FileUploadError model
                  // i + 2 is the real excel user-friendly index of the line
                  return Employee.app.models.FileUploadError.create({
                    line: item.line,
                    message: err.message,
                    fileUploadId: options.fileUpload
                  }, done(null));
                } else {
                  return done();
                }
              });
              done()
            }, err => {
              if (err) return callback(err);
              if (errors.length > 0) return callback(errors);
              callback()
            })
          }
        ], err => {
          if (err) return cb(err);
          cb();
        })

      });

  };

  Employee.import_postprocess_success = function (ctx, container, file, options, callback) {
    return Employee.app.models.FileUpload.findById(options.fileUpload, function (err, fileUpload) {
      if (err) {
        return callback(err);
      }
      fileUpload.status = 'SUCCESS';
      return fileUpload.save(callback);
    });
  };

  Employee.import_postprocess_error = function (ctx, container, file, options, callback) {
    return Employee.app.models.FileUpload.findById(options.fileUpload, function (err, fileUpload) {
      if (err) {
        return callback(err);
      }
      fileUpload.status = 'ERROR';
      return fileUpload.save(callback);
    });
  };

  Employee.import_clean = function (ctx, container, file, options, callback) {
    return Employee.app.models.Container.destroyContainer(container, callback);
  };

  Employee.import_handleLine = function (ctx, item, options, callback) {
    let myItem = JSON.parse(JSON.stringify(item));
    
    return async.waterfall([
      // validate data
      done => {
        if (myItem.content[1] === '' || !myItem.content[1]) {
          return rejectLine('EmployeeName', myItem.content[1], 'Employee Name cannot be empty', done);
        }
        if (myItem.content[2] === '' || !myItem.content[2]) {
          return rejectLine('Email', myItem.content[2], 'Email cannot be empty', done);
        }
        if (myItem.content[3] === '' || !myItem.content[3]) {
          return rejectLine('Division', myItem.content[3], 'Division cannot be empty', done);
        }
        if (myItem.content[4] === '' || !myItem.content[4]) {
          return rejectLine('Position', myItem.content[4], 'Position cannot be empty', done);
        }
        let dob = new Date(myItem.content[9])
        if (Object.prototype.toString.call(dob) === "[object Date]") {
          // it is a date
          if (isNaN(dob.getTime())) { // d.valueOf() could also work
            // date is not valid
            return rejectLine('DOB', myItem.content[9], 'Date of Birth is not Valid', done);
          } else {
            // date is valid
          }
        } else {
          // not a date
          return rejectLine('DOB', myItem.content[9], 'Date of Birth is not Valid', done);
        }
        if (myItem.content[9] === '' || !myItem.content[9]) {
          return rejectLine('DOB', myItem.content[9], 'Date of Birth is not Valid', done);
        }
        if (myItem.content[10] === '' || !myItem.content[10]) {
          return rejectLine('Sex', myItem.content[10], 'Gender cannot be empty', done);
        }
        let joinDate = new Date(myItem.content[11])
        if (Object.prototype.toString.call(joinDate) === "[object Date]") {
          // it is a date
          if (isNaN(joinDate.getTime())) { // d.valueOf() could also work
            // date is not valid
            return rejectLine('DOB', myItem.content[11], 'Date of Birth is not Valid', done);
          } else {
            // date is valid
          }
        } else {
          // not a date
          return rejectLine('DOB', myItem.content[11], 'Date of Birth is not Valid', done);
        }
        if (myItem.content[11] === '' || !myItem.content[11]) {
          return rejectLine('JoinDate', myItem.content[11], 'Join Date is not Valid', done);
        }
        // if ((myItem.content[15] !== '' || myItem.content[15]) && options.roleid !== '1') {
        //   return rejectLine('Role', myItem.content[15], 'Set role is not authorized', done);
        // }

        // if (myItem.content[0] === null) {
        //   return rejectLine('First', myItem.content[0], 'Test Make Error', done);
        // }
        return done();
      },
      done => {
        return Employee.findOne({
          where: {
            email: myItem.content[2].text ? myItem.content[2].text : myItem.content[2],
            companyId: options.companyId
          }
        }, {
            transaction: ctx.transaction
          }, (error, found) => {
            var employee;
            
            if (error) {
              return done(error);
            }

            if (options.roleid === '1') {
              employee = {
                // username: 'james.dean',
                name: myItem.content[1],
                email: myItem.content[2].text ? myItem.content[2].text : myItem.content[2],
                password: 'thisisasecret',
                companyId: options.companyId,
                division: myItem.content[3],
                dob: myItem.content[9],
                joinDate: myItem.content[11],
                sex: myItem.content[10],
                position: myItem.content[4],
                roleId: Role[myItem.content[15]] ? Role[myItem.content[15]] : 31
              };
            } else {
              employee = {
                // username: 'james.dean',
                name: myItem.content[1],
                email: myItem.content[2].text ? myItem.content[2].text : myItem.content[2],
                password: 'thisisasecret',
                companyId: options.companyId,
                division: myItem.content[3],
                dob: myItem.content[9],
                joinDate: myItem.content[11],
                sex: myItem.content[10],
                position: myItem.content[4]
              };
            }

            if (found) {
              employee.id = found.id
              employee.password = found.password
              if (employee.companyId != found.companyId)
                return rejectLine('Email', myItem.content[2].text ? myItem.content[2].text : myItem.content[2], 'Email Account was used at another company before', done);
            } else {
              employee.username = myItem.content[2].text ? myItem.content[2].text : myItem.content[2];
              employee.password = 'thisisasecret';
              employee.doEvaluateCompetence = false;
              employee.doProfileTest = true;
              employee.overallRate = 1;
            }
            
            return Employee.upsert(employee, {
              transaction: ctx.transaction
            }, (error, employee) => {
              if (error) {
                console.log(error);
                return done(error, myItem.content[2].text ? myItem.content[2].text : myItem.content[2]);
              } else {
                return done(null, employee);
              }
            });

          });
      }
    ], function (err, result) {
      // result now equals 'done'
      if (err) return callback(err);
      return callback();
    });

  };

  var rejectLine = function (columnName, cellData, customErrorMessage, callback) {
    var err;
    err = new Error("Unprocessable entity in column " + columnName + " where data = " + cellData + ": " + customErrorMessage);
    err.status = 422;
    return callback(err);
  }
  Employee.remoteMethod('download', {
    isStatic: true,
    accepts: [{
      arg: 'company',
      type: 'number'
    }, {
      arg: 'roleid',
      type: 'number'
    }],
    returns: [{
      arg: 'body',
      type: 'file',
      root: true
    }, {
      arg: 'Content-Type',
      type: 'string',
      http: {
        target: 'header'
      }
    }],
    http: {
      path: '/download',
      verb: 'get'
    }
  });

  Employee.download = function (company, roleid, cb) {
    var emp = [];
    var unstream = require('unstream');

    // Create workbook
    var workbook = new Excel.Workbook();
    workbook.creator = 'Experd';
    workbook.created = new Date();

    // Access worksheet
    var worksheet = workbook.addWorksheet('Employee');

    // Create column
    worksheet.columns = [{
      header: 'Name',
      key: 'name',
      width: 15
    }, {
      header: 'Email',
      key: 'email',
      width: 15
    }, {
      header: 'Division',
      key: 'division',
      width: 15
    }, {
      header: 'Position',
      key: 'position',
      width: 15
    }, {
      header: 'Profile',
      key: 'profile',
      width: 15
    }, {
      header: 'Task on Going',
      key: 'taskOnGoing',
      width: 15
    }, {
      header: 'Task Finish',
      key: 'taskFinish',
      width: 15
    }, {
      header: 'Team',
      key: 'team',
      width: 15
    }, {
      header: 'Date of Birth',
      key: 'age',
      width: 15
    }, {
      header: 'Sex',
      key: 'sex',
      width: 15
    }, {
      header: 'Date of Joining',
      key: 'joinDate',
      width: 15
    }, {
      header: 'Create Task',
      key: 'taskCreate',
      width: 15
    }, {
      header: 'Competence Submission Status',
      key: 'compSubmission',
      width: 15
    }, {
      header: 'Overall Rate',
      key: 'overall',
      width: 15
    }];

    if (roleid === 1) {
      worksheet.columns = [{
        header: 'Name',
        key: 'name',
        width: 15
      }, {
        header: 'Email',
        key: 'email',
        width: 15
      }, {
        header: 'Division',
        key: 'division',
        width: 15
      }, {
        header: 'Position',
        key: 'position',
        width: 15
      }, {
        header: 'Profile',
        key: 'profile',
        width: 15
      }, {
        header: 'Task on Going',
        key: 'taskOnGoing',
        width: 15
      }, {
        header: 'Task Finish',
        key: 'taskFinish',
        width: 15
      }, {
        header: 'Team',
        key: 'team',
        width: 15
      }, {
        header: 'Date of Birth',
        key: 'age',
        width: 15
      }, {
        header: 'Sex',
        key: 'sex',
        width: 15
      }, {
        header: 'Date of Joining',
        key: 'joinDate',
        width: 15
      }, {
        header: 'Create Task',
        key: 'taskCreate',
        width: 15
      }, {
        header: 'Competence Submission Status',
        key: 'compSubmission',
        width: 15
      }, {
        header: 'Overall Rate',
        key: 'overall',
        width: 15
      }, {
        header: 'Role',
        key: 'roleId',
        width: 20
      }];
    }

    worksheet.getRow(1).font = {
      bold: true
    };

    Employee.find({
      "order": "name ASC",
      "where": {
        "companyId": company
      },
      "counts": "team",
      "include": [{
        "relation": "employeeProfileHistories",
        "scope": {
          "order": "date DESC",
          "limit": 1
        }
      }, "employeeTasks", "assignedBy", "team"]
    }, function (error, datas) {
      if (error) {
        cb(null, error);
        return;
      }

      function getTasks(showFinished, tasks) {
        if (showFinished) {
          return tasks.filter(value => value.isDone).length
        } else {
          return tasks.filter(value => !value.isDone).length
        }
      }

      Object.prototype.getKeyByValue = function (value) {
        for (var prop in this) {
          if (this.hasOwnProperty(prop)) {
            if (this[prop] === value)
              return prop;
          }
        }
      }

      for (let data of datas) {
        let myData = JSON.parse(JSON.stringify(data));
        if (roleid === 1) {
          worksheet.addRow([
            myData.name,
            myData.email,
            myData.division,
            myData.position,
            myData.employeeProfileHistories[0] ? myData.employeeProfileHistories[0].profileStamp : '',
            getTasks(false, myData.employeeTasks),
            getTasks(true, myData.employeeTasks),
            myData.team.length,
            new Date(myData.dob),
            myData.sex,
            new Date(myData.joinDate),
            myData.assignedBy.length,
            myData.doEvaluateCompetence ? 'Yes' : '',
            myData.overallRate,
            Role.getKeyByValue(myData.roleId)
          ]);
        }
        else {
          worksheet.addRow([
            myData.name,
            myData.email,
            myData.division,
            myData.position,
            myData.employeeProfileHistories[0] ? myData.employeeProfileHistories[0].profileStamp : '',
            getTasks(false, myData.employeeTasks),
            getTasks(true, myData.employeeTasks),
            myData.team.length,
            new Date(myData.dob),
            myData.sex,
            new Date(myData.joinDate),
            myData.assignedBy.length,
            myData.doEvaluateCompetence ? 'Yes' : '',
            myData.overallRate
          ]);

        }

      }

      //adding data validation
      var cellVal = worksheet.getColumn('roleId');
      cellVal.eachCell({ includeEmpty: true }, function (cell, rowNumber) {
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          showErrorMessage: true,
          formulae: ['"'+Object.getOwnPropertyNames(Role).toString()+'"'],
          promptTitle: 'Role Selection',
          prompt: 'The value should on list'
        };
      });

      // then write it through unstream to a buffer
      workbook.xlsx.write(unstream({}, function (data) {
        // data is your buffer
        cb(null, data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }));

    });
  }

};
