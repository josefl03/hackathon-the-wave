import { run as runAvamet } from './fetch-avamet.js';
import { run as runRvvcca } from './fetch-rvvcca.js';

Promise.all([runAvamet(), runRvvcca()]).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
