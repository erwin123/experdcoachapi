'use strict';

module.exports = function (Employeetask) {

  Employeetask.observe('after save', function filterProperties(ctx, next) {
    
    let employeeId = ctx.instance.employeeId;
    let Employee = Employeetask.app.models.Employee;
    Employee
      .find({
        where: {
          id: employeeId
        },
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
        return next();
      })
    
  });

};

