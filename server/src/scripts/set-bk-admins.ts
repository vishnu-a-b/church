/**
 * Set BK admin credentials from "BK credentials.xlsx"
 *
 * For each entry: finds the Member by phone number, then sets
 *   role = kudumbakutayima_admin
 *   username = email
 *   email = email
 *   password = <from Excel> (Mongoose pre-save hook hashes it)
 *
 * Dry-run by default — pass --apply to actually write changes.
 *
 * npx ts-node --transpile-only src/scripts/set-bk-admins.ts [--apply]
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from '../models/Member';

dotenv.config();

const BK_DATA = [
  { name: 'Ligi Antony',               phone: '9207807948', email: 'christiaugasti@gmail.com',      password: 'Ligi@94832'     },
  { name: 'Reshma Nijo',               phone: '9605273190', email: 'aidenanliya1234@gmail.com',     password: 'Reshma@19082'   },
  { name: 'Rahna Sheejo',              phone: '9526279296', email: 'rahnarapheal@gmail.com',         password: 'Rahna@29692'    },
  { name: 'Clincy Ditto',              phone: '9526903669', email: 'clincychammanath@gmail.com',     password: 'Clincy@66922'   },
  { name: 'Lilly Raphel',             phone: '9895623277', email: 'Lillyraphel277@gmail.com',       password: 'Lilly@27792'    },
  { name: 'Jesna Jaison',             phone: '994699911',  email: 'jesnaj111@gmail.com',            password: 'Jesna@91154'    },
  { name: 'Sini Antony',              phone: '8590562325', email: 'Siniantonysini95@gmail.com',     password: 'Sini@32593'     },
  { name: 'Ginny Joseph Valiyaveettil', phone: '9446873475', email: 'ginnytomy1971@gmail.com',      password: 'Ginny@47542'    },
  { name: 'Rosy Antony',              phone: '8792659295', email: 'rosyandrosary@gmail.com',        password: 'Rosy@29542'     },
  { name: 'Princy A.K',              phone: '9745195116', email: 'princyjoseph064@gmail.com',       password: 'Princy@11612'   },
  { name: 'Gracy Sunny',             phone: '9287978847', email: 'gracysunny68@gmail.com',          password: 'Gracy@84721'    },
  { name: 'Rosily Davis',            phone: '8848384387', email: 'rosilyaluckal@gmail.com',         password: 'Rosily@38742'   },
  { name: 'Jolly Bassy',             phone: '9446979180', email: 'bassyjolly@gmail.com',            password: 'Jolly@18062'    },
  { name: 'Baby Baby',               phone: '6238057041', email: 'babycl575@gmail.com',             password: 'Baby@04141'     },
  { name: 'Alice Paul',              phone: '9496751599', email: 'alicepaulteacher@gmail.com',      password: 'Alice@59942'    },
  { name: 'Paul Thattil',            phone: '9526359201', email: 'paulosethattil@gmail.com',        password: 'Paul@20111'     },
  { name: 'Joseph D Manacheri',      phone: '9847852269', email: 'advjosephmenachery@gmail.com',    password: 'Joseph@26921'   },
  { name: 'K C Antony',              phone: '8075074180', email: 'kcantony59@gmail.com',            password: 'K@18031'        },
  { name: 'Ajith Antony',            phone: '8921509913', email: 'ajithchittillappilly5@gmail.com', password: 'Ajith@91333'   },
  { name: 'Litty Anto',              phone: '8281772550', email: 'littyanto1000@gmail.com',         password: 'Litty@550183'   },
  { name: 'Soja Thomas',             phone: '7306043732', email: 'sibithomas2021@gmail.com',        password: 'Soja@73282'     },
  { name: 'Lekha Antony',            phone: '6282938875', email: 'lekhaantony1971@gmail.com',       password: 'Lekha@87532'    },
  { name: 'Joy J Alappat',           phone: '7025829041', email: 'alappatjoy@gmail.com',            password: 'Joy@04162'      },
  { name: 'Varghese',                phone: '9995843047', email: 'vargheseparackal05@gmail.com',    password: 'Varghese@047101'},
  { name: 'Raphael KL',              phone: '9427110660', email: 'raphaelbsnl@gmail.com',           password: 'Raphael@66061'  },
  { name: 'Baby Babu',               phone: '9847976676', email: 'baby143babu1985@gmail.com',       password: 'Baby@67661'     },
  { name: 'Shiny Baby',              phone: '9496441977', email: 'shinybaby962@gmail.com',          password: 'Shiny@97792'    },
  { name: 'Sajani Simson',           phone: '9747169656', email: 'sajanisimson@gmail.com',          password: 'Sajani@65643'   },
  { name: 'Thressia Paul',           phone: '8921309335', email: 'thressiapaul56@gmail.com',        password: 'Thressia@33582' },
  { name: 'Shiny Philip',            phone: '9747038909', email: 'shiny4078@gmail.com',             password: 'Shiny@90962'    },
  { name: 'Omana C D',               phone: '9605290734', email: 'cdomana129@gmail.com',            password: 'Omana@73434'    },
  { name: 'Annie Anto',              phone: '9447691205', email: 'annieantojsab@gmail.com',         password: 'Annie@20591'    },
  { name: 'Jeena Roy',               phone: '9562290359', email: 'Jeenaroy1234@gmail.com',          password: 'Jeena@35951'    },
  { name: 'Jini Seby',               phone: '9496393519', email: 'Jiniseby8074@gmail.com',          password: 'Jini@51993'     },
  { name: 'Omana Lawrence',          phone: '9645146085', email: 'omanalawrence1@gmail.com',        password: 'Omana@08521'    },
  { name: 'Lisy Raphael',            phone: '9745095655', email: 'rixonraphel123@gmail.com',        password: 'Lisy@65581'     },
  { name: 'Dessy Shaju',             phone: '8129241501', email: 'dessyshaju8@gmail.com',           password: 'Dessy@50143'    },
  { name: 'Suni Thomas',             phone: '9526751251', email: 'sunithomas341@gmail.com',         password: 'Suni@25112'     },
];

const apply = process.argv.includes('--apply');

const run = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-wallet';
  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB  [${apply ? 'APPLY' : 'DRY-RUN'}]\n`);

  const seenPhones = new Set<string>();
  let updated = 0, notFound = 0, skipped = 0;

  for (const row of BK_DATA) {
    // Deduplicate by phone (Excel has Ajith Antony twice)
    if (seenPhones.has(row.phone)) {
      console.log(`SKIP  (duplicate) ${row.name}  ${row.phone}`);
      skipped++;
      continue;
    }
    seenPhones.add(row.phone);

    const member = await Member.findOne({ phone: row.phone });
    if (!member) {
      console.log(`NOT FOUND         ${row.name}  ${row.phone}`);
      notFound++;
      continue;
    }

    console.log(`FOUND  ${member.uniqueId}  ${member.firstName} ${member.lastName || ''}  (${member.phone})`);
    console.log(`       role: ${member.role} -> kudumbakutayima_admin`);
    console.log(`       username: ${member.username || '(none)'} -> ${row.email}`);
    console.log(`       email: ${member.email || '(none)'} -> ${row.email}`);

    if (apply) {
      // Clear this email/username from any other member first (avoids unique-index conflict)
      const cleared = await Member.updateMany(
        { _id: { $ne: member._id }, $or: [{ email: row.email }, { username: row.email }] },
        { $unset: { email: '', username: '' } },
      );
      if (cleared.modifiedCount > 0) {
        console.log(`       ⚠ Cleared email/username from ${cleared.modifiedCount} other member(s)`);
      }

      member.role = 'kudumbakutayima_admin';
      member.username = row.email;
      member.email = row.email;
      member.password = row.password; // pre-save hook will hash this
      await member.save();
      console.log(`       ✓ Updated`);
    }
    console.log();
    updated++;
  }

  console.log('─'.repeat(60));
  console.log(`Total in Excel  : ${BK_DATA.length}`);
  console.log(`Matched         : ${updated}`);
  console.log(`Not found       : ${notFound}`);
  console.log(`Skipped (dupes) : ${skipped}`);
  if (!apply) console.log('\nRe-run with --apply to write changes.');

  await mongoose.disconnect();
};

run().catch((err) => { console.error(err); process.exit(1); });
