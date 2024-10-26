import express, { Application, ErrorRequestHandler } from 'express';
const app: Application = express();
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import applicants from './routes/applicants.js';
import courses from './routes/courses.js';
import years from './routes/years.js';
import applications from './routes/applications.js';
import staffs from './routes/staffs.js';


app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(helmet());

app.set('trust proxy', 1);
app.use(cors({
  origin: ['http://localhost:4173', 'http://localhost:5173'],
  credentials: true
}));

app.use('/applicants', applicants);
app.use('/applications', applications);
app.use('/courses', courses);
app.use('/academic_years', years);
app.use('/staffs', staffs);

app.use(((err, _req, res, next) => {
  console.error(err.stack);
  if(err instanceof SyntaxError) {
    return res.status(400).send({ error: 'Invalid json' });
  }

  next();
}) as ErrorRequestHandler);

app.listen(process.env.PORT, () => {
  console.clear();

  console.log("\n");
  console.log("==============================================================");
  console.log("                      SERVER IS RUNNING                       ");
  console.log("==============================================================");
  console.log("   To stop the server, press 'Ctrl + C' or close this window. ");
  console.log("==============================================================\n");
});

export default app;