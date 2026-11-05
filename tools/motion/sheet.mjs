// Review sheet of every customer look and mood. Writes to the path given.
import fs from 'fs';
import { createCanvas } from '@napi-rs/canvas';
import { LOOKS, drawCustomer, setCustomerState } from './customer.mjs';
const names = Object.keys(LOOKS), moods = ['neutral', 'annoyed', 'angry', 'sad', 'shock', 'happy'];
const cv = createCanvas(1900, 1240), c = cv.getContext('2d'); c.fillStyle = '#efedea'; c.fillRect(0, 0, 1900, 1240);
names.forEach((n, i) => { setCustomerState({ t: 1, tl: moods[i % 6] }); drawCustomer(c, n, 95 + i * 190, 590, 560); });
names.forEach((n, i) => { const m = moods[i % 6]; setCustomerState({ t: 1, tl: m, talk: i % 3 === 0 ? .8 : 0, raise: i === 2 ? [0, 9] : null }); drawCustomer(c, n, 95 + i * 190, 1000 + 330, 660, { seated: true }); });
c.fillStyle = '#f5ecdf'; c.fillRect(0, 960, 1900, 280);
fs.writeFileSync(process.argv[2], await cv.encode('jpeg', 90));
