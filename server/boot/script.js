'use strict';

module.exports = function (app) {
  var Employee = app.models.Employee;
  var Employeeteam = app.models.Employeeteam;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;
  var Team = app.models.Team;

  var Company = app.models.Company;
  var Competence = app.models.Competence;
  var CompetenceSet = app.models.CompetenceSet;
  var Companycompetence = app.models.Companycompetence;
  var CompanySet = app.models.CompanySet;
  var _ = require('lodash');

  var Profile = app.models.Profile;
  var Profiletest = app.models.ProfileTest;
  var Profiletestchoice = app.models.ProfileTestChoice;

  // Employee.hasMany(Employee, {
  //   as: 'teamheaders',
  //   foreignKey: 'teamheaderId',
  //   keyThrough: 'teamdetailId',
  //   through: Employeeteam
  // });
  // Employee.hasMany(Employee, {
  //   as: 'teamdetails',
  //   foreignKey: 'teamdetailId',
  //   keyThrough: 'teamheaderId',
  //   through: Employeeteam
  // });
  // Employeeteam.belongsTo(Employee, {
  //   as: 'teamheader'
  // });
  // Employeeteam.belongsTo(Employee, {
  //   as: 'teamdetail'
  // });

  Employee.create([{
    username: 'dmastag',
    name: 'Julian Yahoo',
    email: 'dmastag@yahoo.com',
    password: 'thisisasecret',
    companyId: 1,
    position: 'Administrator'
  }, {
    username: 'julian.alimin',
    name: 'Julian Alimin',
    email: 'julian.alimin@yahoo.com',
    password: 'thisisasecret',
    companyId: 1,
    position: 'Manager'
  }, {
    username: 'donny.siregar',
    name: 'Donny Siregar',
    email: 'donny.siregar@yahoo.com',
    password: 'thisisasecret',
    companyId: 1,
    division: 'Marketing',
    dob: new Date(1977, 11, 13),
    joinDate: new Date(2009, 1, 8),
    sex: 'male',
    doEvaluateCompetence: false,
    doProfileTest: false,
    overallRate: 1,
    position: 'Director'
  }, {
    username: 'john.denver',
    name: 'John Denver',
    email: 'john.denver@yahoo.com',
    password: 'thisisasecret',
    companyId: 1,
    division: 'Marketing',
    dob: new Date(1982, 3, 6),
    joinDate: new Date(2010, 12, 21),
    sex: 'male',
    doEvaluateCompetence: false,
    doProfileTest: true,
    overallRate: 1,
    position: 'Manager'
  }, {
    username: 'sarah.rose',
    name: 'Sarah Rose',
    email: 'sarah.rose@yahoo.com',
    password: 'thisisasecret',
    companyId: 1,
    division: 'Marketing',
    dob: new Date(1991, 5, 3),
    joinDate: new Date(2015, 10, 7),
    sex: 'male',
    doEvaluateCompetence: true,
    doProfileTest: true,
    overallRate: 1,
    position: 'Junior Staff'
  }, {
    username: 'danny.g',
    name: 'Danny G.',
    email: 'danny.g@yahoo.com',
    password: 'thisisasecret',
    companyId: 1,
    division: 'Marketing',
    dob: new Date(1994, 6, 3),
    joinDate: new Date(2016, 2, 23),
    sex: 'male',
    doEvaluateCompetence: true,
    doProfileTest: true,
    overallRate: 1,
    position: 'Junior Staff'
  }, {
    username: 'james.dean',
    name: 'James Dean',
    email: 'james.dean@yahoo.com',
    password: 'thisisasecret',
    companyId: 1,
    division: 'Marketing',
    dob: new Date(1986, 7, 4),
    joinDate: new Date(2007, 11, 18),
    sex: 'male',
    doEvaluateCompetence: false,
    doProfileTest: false,
    overallRate: 1,
    position: 'Senior Staff'
  }, {
    username: 'jamie.oliver',
    name: 'Jamie Oliver',
    email: 'jamie.oliver@yahoo.com',
    password: 'thisisasecret',
    companyId: 1,
    division: 'Marketing',
    dob: new Date(1989, 7, 2),
    joinDate: new Date(2015, 3, 22),
    sex: 'male',
    doEvaluateCompetence: false,
    doProfileTest: true,
    overallRate: 1,
    position: 'Asst. Manager'
  }], function (err, employees) {
    if (err) return err;

    Profile.create({
      title: 'Plodder',
      description: 'Senang Aman. Tipe stabil, senang pekerjaan rutin. Lambat, tetapi tekun dalam bekerja. Senang mengerjakan tugas sebaik-baiknya. Dapat diandalkan. Tidak suka mengambil resiko. Mementingkan rasa aman  dan detil dalam melaksanakan tugas. Berpegangan pada sistem dan prosedur. Topik pembicaraan yang disenangi: proses dan cara yang tepat untuk keamanan dan menghindari resiko.'
    })

    Profile.create({
      title: 'Doer',
      description: 'Senang Cepat. Tipe pencapai sukses, kompetitif, Enerjik. Ingin dihormati (kesuksesannya). Segala sesuatu harus terselesaikan dengan baik. Sering tidak sabar: merasa waktu kurang karena banyak yang ingin dilakukan. Menentang segala sesuatu yang menghambat keberhasilan. Impulsif, membuat keputusan secara cepat berdasarkan naluri dan informasi seperlunya. Topik pembicaraan yang disenangi: prestasi dan kesuksesan.'
    })    

    Profile.create({
      title: 'Controller',
      description: 'Senang Mengendalikan. Tipe logis - rasional. Teroganisir dengan baik, memperhatikan detil. Keputusan yang diambil didasarkan pada fakta dan perhitungan yang matang. Tidak emosional. Menyimpan informasi secara rapi dan dapat segera “mengeluarkannya” saat diperlukan. Dapat memanfaatkan waktu secara baik. Topik pembicaraan yang disenangi: efisiensi dan pengorganisasian.'
    })

    Profile.create({
      title: 'Talker',
      description: 'Senang Berbicara. Tipe sosial, mudah akrab, bersahabat. Ingin disukai. Senang berhubungan dengan orang, bercanda dan mengobrol. Mudah membuka diri. Senang beragam topik pembicaraan ringan.'
    })

    Profiletest.create({
      orderId: 1,
      question: 'Jika Anda berencana untuk membeli sebuah HP, lalu anda pergi ke pusat pertokoan HP maka biasanya Anda akan:',
      isActive: true
    }, (err, profiletest) => {
      Profiletestchoice.create([{
        orderId: 1,
        isActive: true,
        choice: 'Memasuki lebih dari 3 toko, bertanya mengenai fitur HP dan biasanya akan membeli di toko yang bersedia menjelaskan dengan detil dan lengkap',
        profileTestId: profiletest.id
      }, {
        orderId: 2,
        isActive: true,
        choice: 'Masuk ke satu toko yang paling ramai dan barangnya paling update, lalu membeli di toko tersebut',
        profileTestId: profiletest.id
      }, {
        orderId: 3,
        isActive: true,
        choice: 'Masuk ke sebuah toko dan akan membeli HP yang penjualannya akan memberikan jaminan servis pasca pembelian yang menarik',
        profileTestId: profiletest.id
      }, {
        orderId: 4,
        isActive: true,
        choice: 'Membeli HP di toko yang penjualnya ramah dan enak diajak ngobrol',
        profileTestId: profiletest.id
      }])
    })

    Profiletest.create({
      orderId: 2,
      question: 'Jika Anda akan bepergian dengan menggunakan jasa tour, maka pada saat briefing fokus Anda biasanya lebih ke:',
      isActive: true
    }, (err, profiletest) => {
      Profiletestchoice.create([{
        orderId: 1,
        isActive: true,
        choice: 'Menanyakan agenda perjalanan dari jam ke jam, mulai dari hari pertama hingga hari kepulangan',
        profileTestId: profiletest.id
      }, {
        orderId: 2,
        isActive: true,
        choice: 'Mengamati si tour leader, apakah sepertinya dia kredible dan berpengalaman sebagai tour leader',
        profileTestId: profiletest.id
      }, {
        orderId: 3,
        isActive: true,
        choice: 'Menanyakan ke tour leader cara penanganan bila terjadi hal-hal yang kurang diinginkan selama perjalanan',
        profileTestId: profiletest.id
      }, {
        orderId: 4,
        isActive: true,
        choice: 'Mengamati teman-teman seperjalanan Anda, apakah termasuk orang yang sepertinya ‘enak’ sebagai teman wisata',
        profileTestId: profiletest.id
      }])
    })

    Profiletest.create({
      orderId: 3,
      question: 'Anda biasanya akan memutuskan untuk secara tetap berobat ke dokter tertentu karena alasan:',
      isActive: true
    }, (err, profiletest) => {
      Profiletestchoice.create([{
        orderId: 1,
        isActive: true,
        choice: 'Dokter tersebut saat konsultasi sering bertanya panjang lebar dan detil kepada Anda ',
        profileTestId: profiletest.id
      }, {
        orderId: 2,
        isActive: true,
        choice: 'Reputasi dan kredibilitas dokter tersebut sudah tersohor',
        profileTestId: profiletest.id
      }, {
        orderId: 3,
        isActive: true,
        choice: 'Dokter tersebut mengatakan bahwa bila terjadi emergency situation, ia bersedia ditelepon di hp nya',
        profileTestId: profiletest.id
      }, {
        orderId: 4,
        isActive: true,
        choice: 'Beberapa teman dan relasi Anda sudah lebih dulu berlangganan ke dokter tersebut',
        profileTestId: profiletest.id
      }])
    })

    Profiletest.create({
      orderId: 4,
      question: 'Jika pada suatu hari secara mendadak Anda diajak oleh sahabat lama untuk berpergian ke tempat wisata yang mengasyikkan, maka Anda:',
      isActive: true
    }, (err, profiletest) => {
      Profiletestchoice.create([{
        orderId: 1,
        isActive: true,
        choice: 'Bertanya dulu persisnya akan kemana saja dan acaranya apa saja. Jika memang banyak effort yang harus anda korbankan, mungkin Anda memilih untuk tidak pergi saja.',
        profileTestId: profiletest.id
      }, {
        orderId: 2,
        isActive: true,
        choice: 'Jika tempat itu memang menarik dan tidak ada masalah dengan akomodasi, maka Anda akan berangkat',
        profileTestId: profiletest.id
      }, {
        orderId: 3,
        isActive: true,
        choice: 'Anda akan berangkat setelah anda punya cukup waktu untuk meninggalkan berbagai pesan ke orang rumah jika ada apa-apa terjadi selama Anda bepergian',
        profileTestId: profiletest.id
      }, {
        orderId: 4,
        isActive: true,
        choice: 'Jika sahabat lama Anda tersebut masih sama menyenangkannya seperti dulu dan pilihan tempat wisatanya adalah tempat yang memorable bagi Anda, mungkin anda akan mengiyakan ajakannya',
        profileTestId: profiletest.id
      }])
    })

    Profiletest.create({
      orderId: 5,
      question: 'Anda biasanya memutuskan untuk memilih untuk berlangganan di butik tertentu karena:',
      isActive: true
    }, (err, profiletest) => {
      Profiletestchoice.create([{
        orderId: 1,
        isActive: true,
        choice: 'Anda diberikan konsultasi cuma-Cuma mengenai model busana seperti apa yang paling cocok untuk postur dan keperluan Anda',
        profileTestId: profiletest.id
      }, {
        orderId: 2,
        isActive: true,
        choice: 'Anda selalu diinformasikan mengenani produk-produk ter-update nya',
        profileTestId: profiletest.id
      }, {
        orderId: 3,
        isActive: true,
        choice: 'Anda diberikan fleksibilitas dalam melakukan tranksaksi, seperti bisa diantar ke rumah dan bisa memilih-milih di rumah Anda',
        profileTestId: profiletest.id
      }, {
        orderId: 4,
        isActive: true,
        choice: 'Para karyawan tokonya semua sudah seperti saudara, saking akrabnya',
        profileTestId: profiletest.id
      }])
    })

    Profiletest.create({
      orderId: 6,
      question: 'Alasan pribadi (selain materil dan kompensasi) yang paling membuat Anda betah bekerja di sebuah perusahaan adalah:',
      isActive: true
    }, (err, profiletest) => {
      Profiletestchoice.create([{
        orderId: 1,
        isActive: true,
        choice: 'Adanya kejelasan mengenai aturan main, prosedur dan sistem kerja untuk para karyawan',
        profileTestId: profiletest.id
      }, {
        orderId: 2,
        isActive: true,
        choice: 'Anda punya banyak peluang untuk ‘tampil’ dan mengambil action sesuai dengan ‘pace’ anda yang cepat',
        profileTestId: profiletest.id
      }, {
        orderId: 3,
        isActive: true,
        choice: 'Anda diberikan kebebasan untuk mengatur cara kerja Anda sendiri',
        profileTestId: profiletest.id
      }, {
        orderId: 4,
        isActive: true,
        choice: 'Orang-orangnya setipe dan banyak kesamaan karakter dengan Anda',
        profileTestId: profiletest.id
      }])
    })

    Profiletest.create({
      orderId: 7,
      question: 'Dalam mengambil keputusan yang tergolong ‘tough’ biasanya Anda akan:',
      isActive: true
    }, (err, profiletest) => {
      Profiletestchoice.create([{
        orderId: 1,
        isActive: true,
        choice: 'Mengacu kepada cara kerja dan policy yang berlaku',
        profileTestId: profiletest.id
      }, {
        orderId: 2,
        isActive: true,
        choice: 'Mengambil keputusan yang paling praktis dengan cepat',
        profileTestId: profiletest.id
      }, {
        orderId: 3,
        isActive: true,
        choice: 'Melakukan analisa resiko dan benefit lalu mengambil keputusan untuk yang benefitnya paling tinggi',
        profileTestId: profiletest.id
      }, {
        orderId: 4,
        isActive: true,
        choice: 'Bertanya kepada rekan-rekan atau orang-orang di sekitar Anda dan dasar pertimbangan mereka',
        profileTestId: profiletest.id
      }])
    })

    Profiletest.create({
      orderId: 8,
      question: 'Saat anda memasuki lingkungan baru dan ingin mempelajari lingkungan tersebut, biasanya anda lebih nyaman melakukannya dengan cara :',
      isActive: true
    }, (err, profiletest) => {
      Profiletestchoice.create([{
        orderId: 1,
        isActive: true,
        choice: 'Membaca buku yang menyangkut aturan umum atau tatacara/prosedur yang berlaku di tempat tersebut.',
        profileTestId: profiletest.id
      }, {
        orderId: 2,
        isActive: true,
        choice: 'Langsung melebur dan bereksperimen dalam situasi tersebut',
        profileTestId: profiletest.id
      }, {
        orderId: 3,
        isActive: true,
        choice: 'Menyiapkan daftar pertanyaan yang mendetail dan menyimpan hasil penggalian anda secara terorganisir',
        profileTestId: profiletest.id
      }, {
        orderId: 4,
        isActive: true,
        choice: 'Bertanya kepada orang yang anda merasa “cocok” dan bersedia membantu anda',
        profileTestId: profiletest.id
      }])
    })

    employees[3].team.add(employees[4]);
    employees[3].team.add(employees[5]);
    employees[3].team.add(employees[6]);
    employees[3].team.add(employees[7]);
    employees[4].supervisor.add(employees[3]);
    employees[5].supervisor.add(employees[3]);
    employees[6].supervisor.add(employees[3]);
    employees[7].supervisor.add(employees[3]);


    console.log('Created employees:', employees);
    //create the admin role
    Role.create({
      name: 'admin'
    }, function (err, role) {
      if (err) throw err;

      console.log('Created role:', role);

      //make julian an admin
      role.principals.create({
        principalType: RoleMapping.EMPLOYEE,
        principalId: employees[0].id
      }, function (err, principal) {
        if (err) throw err;

        console.log('Created principal:', principal);
      });
    });

    Company.create([{
      name: "Pertamina Oil & Gas",
      accountLimit: "100",
      admin: employees[3]
    }, {
      name: "Indofood Sukses Makmur Tbk",
      accountLimit: "100",
      admin: employees[1]
    }, {
      name: "Semen Indonesia Tbk",
      accountLimit: "100",
      admin: employees[1]
    }, {
      name: "Gudang Garam Tbk",
      accountLimit: "100",
      admin: employees[1]
    }, {
      name: "HM Sampoerna",
      accountLimit: "100",
      admin: employees[1]
    }, {
      name: "Borneo Mining Corporation",
      accountLimit: "100",
      admin: employees[1]
    }], function (err, companies) {
      if (err) return err;

      Competence.create([{
        name: "Discipline",
        definition: "Lorem Ipsum dolor",
        keybehaviour: "Key Behaviour Lorem Ipsum",
      }, {
        name: "Professionalism",
        definition: "Lorem Ipsum dolor",
        keybehaviour: "Key Behaviour Lorem Ipsum",
      }, {
        name: "Teamwork",
        definition: "Lorem Ipsum dolor",
        keybehaviour: "Key Behaviour Lorem Ipsum",
      }, {
        name: "Customer Service",
        definition: "Lorem Ipsum dolor",
        keybehaviour: "Key Behaviour Lorem Ipsum",
      }, {
        name: "Creativity",
        definition: "Lorem Ipsum dolor",
        keybehaviour: "Key Behaviour Lorem Ipsum",
      }, {
        name: "Initiative",
        definition: "Lorem Ipsum dolor",
        keybehaviour: "Key Behaviour Lorem Ipsum",
      }, {
        name: "Strategic Thinking",
        definition: "Lorem Ipsum dolor",
        keybehaviour: "Key Behaviour Lorem Ipsum",
      }, {
        name: "Innovation",
        definition: "Lorem Ipsum dolor",
        keybehaviour: "Key Behaviour Lorem Ipsum",
      }, {
        name: "Self Confidence",
        definition: "Lorem Ipsum dolor",
        keybehaviour: "Key Behaviour Lorem Ipsum",
      }, {
        name: "Flexibility",
        definition: "Lorem Ipsum dolor",
        keybehaviour: "Key Behaviour Lorem Ipsum",
      }], function (err, competences) {
        if (err) return err;

        ////    



        let compCounter = [0, 1, 2, 3, 4, 5];
        for (let competence of competences) {

          for (let value of compCounter) {
            competence.competenceLevels.create([{
              level: value,
              description: "lorem epsum"
            }])
          }

          for (let company in companies) {
            competence.companies.add(company, function (err, company) {
              // console.log(company);
            })
          }
        }


        // Code to add Competence Set

        let arrCompSet = []
        for (let company of companies) {

          arrCompSet.push({
            name: 'Account',
            company: company
          }, {
            name: 'Admin',
            company: company
          }, {
            name: 'Assistant Manager (Distribution)',
            company: company
          }, {
            name: 'Assistant Manager (Finance)',
            company: company
          }, {
            name: 'Assistant Manager (Production)',
            company: company
          }, {
            name: 'Junior Staff',
            company: company
          }, {
            name: 'Manager (Distribution)',
            company: company
          }, {
            name: 'Manager (Finance)',
            company: company
          }, {
            name: 'Manager (Production)',
            company: company
          }, {
            name: 'Senior Staff',
            company: company
          }, {
            name: 'Staff',
            company: company
          })
        }

        CompetenceSet.create([...arrCompSet], function (err, compSets) {
          console.log('compSets', compSets.length, compSets);
          // for (let companyset of compSets) {

          //   Company.findById(companyset.companyId, {
          //     include: {
          //       relation: 'competences',
          //       scope: {
          //         include: {
          //           relation: 'competenceLevels'
          //         }
          //       }
          //     }
          //   }, (err, compCompLevel) => {
          //     console.log(compCompLevel, _.sample(compCompLevel.competences.competenceLevels));

          //     companyset.competenceLevels.add(_.sample(compCompLevel.competences.competenceLevels), function (err, myCompRel) {
          //       // console.log(myCompRel);
          //     })
          //   })
          // }

        })

      })
    })
  });
};
