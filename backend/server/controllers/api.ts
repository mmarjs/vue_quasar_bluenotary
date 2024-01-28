import aws from 'aws-sdk';
import { matchedData } from 'express-validator';
import _ from 'lodash';
import mongoose from 'mongoose'
import signer from 'node-signpdf';
import {plainAddPlaceholder} from 'node-signpdf/dist/helpers'
import path from 'path';
import { PDFDocument } from 'pdf-lib'
import emailer from '../middleware/emailer';
const http = require('http');
import * as utils from '../middleware/utils';
import { DocumentModel } from '../models/documentsdata';
import { IdentityModel } from '../models/identitydata'
import { NewSessionModel } from '../models/newsessiondata';
import { NotaryDataModel } from '../models/notarydata'
import { PDFDroppedElementsModel } from '../models/pdfdroppedelementsdata'
// import { SessionModel } from '../models/sessiondata'
import { SignaturesDataModel } from '../models/signaturesdata'
import { dbBackup } from '../service/DbBackup';
const uuid = require('uuid');
const fs = require('fs');
import { v4 as uuidV4 } from 'uuid';
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const request = require('request');
const util = require('util');
import dotenv from 'dotenv';
dotenv.config();
// import mongoose from 'mongoose'
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripeTest = require('stripe')(process.env.STRIPE_SECRET_KEY_TEST);
const User = require('../models/user');
const DocumentTemplate = require('../models/documentTemplate');
const SessionUserLogs = require('../models/sessionUserLogs');
const SessionWitness = require('../models/sessionWitness');
const WitnessModel = require('../models/witness');
const controller = require('./api');
const moment = require('moment');
const glob = require('glob')
const ffmpeg = require('fluent-ffmpeg');
const exec = util.promisify(require('child_process').exec);
const sharp = require('sharp')

// const PricingJson = require('../../../server/constants/pricing.json')
const PricingJson = {
  pricing: {
      'Arizona': {
          notaryFee: '10.00',
          serviceFee: '17.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      },
      'Colorado': {
          notaryFee: '10.00',
          serviceFee: '17.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      },
      'Maryland': {
          notaryFee: '4.00',
          serviceFee: '23.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      },
      'New York': {
          notaryFee: '5.00',
          serviceFee: '22.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      },
      'Others': {
          notaryFee: '25.00',
          serviceFee: '2.00',
          loan_signing: {
            notaryFee: '150.00',
            notaryFeeText: 'Loan Signing Notarization',
            serviceFee: '0.00'
          }
      }
  }
}
const AlertingService = require('../service/AlertingService')

const videoSavingDir = './tmp';

const SESSION_TIMEOUT_IN_MINUTES = 30
aws.config.update({
  apiVersion: '2006-03-01',
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey,
  region: process.env.AWSRegion
})
console.log({
  apiVersion: '2006-03-01',
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey,
  region: process.env.AWSRegion
})
const s3 = new aws.S3()

exports.db_backup = async (req, res) => {
  try {
    req = matchedData(req);
    console.log('db_backup:', req)
    await dbBackup()
    res.status(200).json({ message: 'Database backup queued successfully.' });
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.uploadFiles = async (req, res) => {
  try {
    const file = req.file
    console.log('uploadFile 2:', file)
    console.log('req:', req.user)
    const user = req.user
    req = matchedData(req);
    console.log('uploadFile 1 :', req)

    if (file) {
      const session = await NewSessionModel.findOne({ _id: req.id });
      // Create Document First
      const uploadedDocument = new DocumentModel({
        sessionid: session._id,
        documentCategory: 'initial_document',
        name: file.originalname,
        url: file.location,
        type: file.mimetype,
        size: file.size,
        key: file.key,
        bucketName: file.bucket,
        uploadedBy: user.id,
        uploadedStage: 'initial_stage'
      });
      await uploadedDocument.save();
      if (!session.originalDocumentIds) {
        session.originalDocumentIds = []
      }
      session.originalDocumentId = uploadedDocument._id;
      session.originalDocumentIds.push(session.originalDocumentId)
      await session.save();

      res.status(200).json({session, url: file.location, document: [uploadedDocument] });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryFileUpload = async (req, res) => {
  try {
    const file = req.file
    const user = req.user
    const dcpassword = req.body.dcpassword || 'bnDCpwd21'
    req = matchedData(req);
    const dcMatchResponse = await checkIfDCPasswordIsValid(file.key, dcpassword)
    if (!dcMatchResponse) {
      return res.status(400).json({
        errors: {
          msg: 'Digital Certificate Password does not match with .p12 certificate'
        }
      })
    }
    if (file) {
      const notarydm = await NotaryDataModel.findOne({ userId: user._id })
      if (notarydm) {
        notarydm.certfileLocation = file.destination
        notarydm.certfileUrl = file.location
        notarydm.certfileSource = 'manual'
        notarydm.certfileAddedAt = new Date()
        notarydm.fileKey = file.key
        notarydm.certfilename = file.originalname
        notarydm.dcpassword = dcpassword
        await notarydm.save()
      } else {
        const newProxy = new NotaryDataModel({
          sessionid: req.id,
          userId: user._id,
          email: user.email,
          certfileLocation: file.destination,
          certfileUrl: file.location,
          certfileSource: 'manual',
          certfileAddedAt: new Date(),
          certfilename: file.originalname,
          fileKey: file.key,
          dcpassword
        })
        await newProxy.save()
      }
      await NotaryDataModel.find({ userId: user._id })
      res.status(200).json({
        message: 'Certificate uploaded successfully.'
      });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryFileDelete = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    if (notarydm) {
      const params = {
        Bucket: process.env.AWSBucket,
        Key: notarydm.fileKey
      }

      try {
        await s3.headObject(params).promise()
        console.log('File Found in S3')
        try {
          await s3.deleteObject(params).promise()
          console.log('file deleted Successfully')
        } catch (err) {
          console.log('ERROR in file Deleting : ' + JSON.stringify(err))
        }
      } catch (err) {
        console.log('File not Found ERROR : ' + err)
      }
      notarydm.certfileLocation = null
      notarydm.certfileUrl = null
      notarydm.certfileSource = null
      notarydm.certfileAddedAt = null
      notarydm.fileKey = null
      notarydm.certfilename = null
      await notarydm.save()
    }
    res.status(200).json({
      message: 'Certificate successfully removed.'
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryCertificatesUpload = async (req, res) => {
  try {
    const file = req.file
    const user = req.user
    req = matchedData(req);
    if (file) {
      const notarydm = await NotaryDataModel.findOne({ userId: user._id })
      if (notarydm) {
        notarydm.notaryCertificates.push({
          name: file.originalname,
          url: file.location,
          key: file.key
        });
        await notarydm.save()
      } else {
        const newProxy = new NotaryDataModel({
          sessionid: req.id,
          notaryCertificates: [{
            name: file.originalname,
            url: file.location,
            key: file.key
          }],
          userId: user._id,
          email: user.email,
          dcpassword: 'bnDCpwd21'
        })
        await newProxy.save()
      }
      await NotaryDataModel.find({ userId: user._id })
      res.status(200).json({
        message: 'Certificate uploaded successfully.'
      });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryCopyOfComissionLetter = async (req, res) => {
  try {
    const file = req.file;
    const user = req.user;
    req = matchedData(req);
    if (file) {
      const notarydm = await NotaryDataModel.findOne({ userId: user._id });
      if (notarydm) {
        notarydm.notaryCopyOfCommissionLetterName = file.originalname;
        notarydm.notaryCopyOfCommissionLetterUrl = file.location;
        notarydm.notaryCopyOfCommissionLetterKey = file.key;
        await notarydm.save();
      } else {
        const newProxy = new NotaryDataModel({
          notaryCopyOfCommissionLetterName: file.originalname,
          notaryCopyOfCommissionLetterUrl: file.location,
          notaryCopyOfCommissionLetterKey: file.key,
          userId: user._id,
          email: user.email,
          dcpassword: 'bnDCpwd21'
        });
        await newProxy.save();
      }
      await NotaryDataModel.find({ userId: user._id });
      res.status(200).json({
        message: 'Copy of Commission Letter uploaded successfully.'
      });
    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryCertificateDelete = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    const data = req.data;
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    if (notarydm) {
      const params = {
        Bucket: process.env.AWSBucket,
        Key: data.key
      }

      try {
        await s3.headObject(params).promise()
        console.log('File Found in S3')
        try {
          await s3.deleteObject(params).promise()
          console.log('file deleted Successfully')
        } catch (err) {
          console.log('ERROR in file Deleting : ' + JSON.stringify(err))
        }
      } catch (err) {
        console.log('File not Found ERROR : ' + err)
      }
      const certificates = notarydm.notaryCertificates.filter((item) => item.key !== data.key);
      notarydm.notaryCertificates = certificates;
      notarydm.save();
    }
    res.status(200).json({
      message: 'Notary certificate successfully removed.'
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.saveNotaryDataFields = async (req, res) => {
  try {
    const user = req.user
    console.log(req.data)
    console.log(req.params)
    console.log(req.body)
    const body = req.body;
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    if (notarydm) {
      if (body.dcpassword) {
        const dcMatchResponse = await checkIfDCPasswordIsValid(notarydm.fileKey, body.dcpassword)
        console.log('dcMatchResponse', dcMatchResponse)
        if (!dcMatchResponse) {
          return res.status(400).json({
            errors: {
              msg: 'Digital Certificate Password does not match with .p12 certificate'
            }
          })
        }
        notarydm.dcpassword = body.dcpassword;
      }
      notarydm.save();
    } else {
      return res.status(400).json({
        errors: {
          msg: 'Please save Digital Certificate first, before saving the password'
        }
      })
    }
    res.status(200).json({
      message: 'Notary certificate Password Updated.'
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.loadsSessionData = async (req, res) => {
  try {
    console.log('req.userId before' , req.userId);
    req = matchedData(req);
    let document = null;
    let sessions = null;
    if (req.sessionId === 'new') {
      console.log('req.userId' , req.userId);
      // create new session
      sessions =  new NewSessionModel({
        sessionid: uuidV4(),
        userId: req.userId,
        sessionCode: (Math.random() + 1).toString(36).substring(7).toUpperCase(),
        currentStage: 'initial_stage',
        status: 'unsigned',
        stagesHistory: [{
            stageName: 'Session created',
            stageDate: new Date()
        }]
      });
      await sessions.save();
    } else {
      sessions = await NewSessionModel.findOne({ _id: req.sessionId });
    }

    if (sessions) {
      document = await DocumentModel.find({ sessionid: sessions._id });
    }

    res.status(200).json({session: sessions, document});

  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.loadsNotaryDetailData = async (req, res) => {
  try {
    const user = req.user
    const dontGetStripe = req.body.dontGetStripe || false;
    req = matchedData(req);
    const sessions = JSON.parse(JSON.stringify(await NotaryDataModel.findOne({ userId: user._id })))
    sessions.stripeAccountDetails = {}
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    // console.log('notarydm', notarydm)
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    if (notarydm && notarydm.stripeAccountName && !dontGetStripe) {
      const account = await stripeToUse.accounts.retrieve(
        notarydm.stripeAccountName
      );
      if (!notarydm.stripeAccountLoginLink) {
        try {
          const stripeResponse = await stripeToUse.accounts.createLoginLink(
            notarydm.stripeAccountName
          );
          if (stripeResponse) {
            notarydm.stripeAccountLoginLink = stripeResponse.url;
            await notarydm.save();
          }
        } catch (error) {
          console.log(error)
        }
      }
      sessions.stripeAccountDetails = notarydm
      sessions.stripeFullAccountDetails = account
    }
    // console.log('sessions.stripeAccountDetails')
    // console.log(sessions.stripeAccountDetails)
    res.status(200).json(sessions);

  } catch (error) {
    utils.handleError(res, error);
  }
};

const seedDocumentTemplates = async (user) => {
  const docs = require('../constants/templates.json')
  const processing = await Promise.all(_.map(docs.templates, async (document) => {
    const template = path.resolve(document.path);
    if (!fs.existsSync(template)) {
      return false;
    }
    const fileContent = fs.readFileSync(template);
    const params = {
      Bucket: process.env.AWSBucket,
      Key: document.key,
      Body: fileContent,
      ACL: 'public-read'
    };
    try {
      const documentData = await s3.upload(params).promise();
      if (documentData) {
        const temp = new DocumentTemplate({
          type: 'predefined',
          name: document.name,
          documentUrl: documentData.Location,
          key: documentData.Key,
          bucketname: documentData.Bucket,
          uploadedBy: user._id
        });
        await temp.save();
      }
    } catch (err) {
      console.log(err);
    }
    return true;
  }));
  return processing;
};

exports.loadDocumentTemplates = async (req, res) => {
  try {
    const user = req.user;
    req = matchedData(req);
    let templates = await DocumentTemplate.find({
      $or: [{ type: 'predefined' }, {uploadedBy: user._id}]
    }).sort({ createdAt: -1 });
    if (!templates.length) {
      await seedDocumentTemplates(user);
      templates = await DocumentTemplate.find({ uploadedBy: user._id }).sort({ createdAt: -1 });
    }
    res.status(200).json(templates);

  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.templateOptions = async (req, res) => {
  try {
    const user = req.user;
    req = matchedData(req);
    let templates = await DocumentTemplate.find({
      $or: [{ type: 'predefined' }, {uploadedBy: user._id}]
    }).sort({ createdAt: -1 });
    if (!templates.length) {
      await seedDocumentTemplates(user);
      templates = await DocumentTemplate.find({ uploadedBy: user._id }).sort({ createdAt: -1 });
    }
    res.status(200).json(templates);

  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryTemplateFindOne = async (req, res) => {
  try {
    const user = req.user;
    req = matchedData(req);
    const template = await DocumentTemplate.findOne({ _id: req.templateId });
    const notaryDatasDoc = await NotaryDataModel.findOne({ userId: user.id })
    const pdfDroppedElementDatas = await PDFDroppedElementsModel.findOne({ templateid: req.templateId });
    res.status(200).json({
      template,
      notaryDatasDoc,
      pdfDroppedElementDatas
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

// pdfdroppedelements

exports.notaryTemplateUpdatePdfDroppedElements = async (req, res) => {
  try {
    let droppedElements = req.body && req.body.droppedElements || [];
    req = matchedData(req);
    const template = await DocumentTemplate.findOne({ _id: req.templateId });
    if (!template) {
      return res.status(404).json({
        error: 'Template Doc Not Found'
      });
    }
    let pdfDroppedElementsDoc = await PDFDroppedElementsModel.findOne({ templateid: req.templateId });
    if (!pdfDroppedElementsDoc) {
      pdfDroppedElementsDoc = new PDFDroppedElementsModel({ templateid: req.templateId })
    }
    console.log('droppedElements', droppedElements)
    if (_.isString(droppedElements)) {
      droppedElements = JSON.parse(droppedElements);
    }
    pdfDroppedElementsDoc.droppedElements = droppedElements
    await pdfDroppedElementsDoc.save()
    res.status(200).json({
      message: 'Template fields successfully updated.'
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryTemplateUpdate = async (req, res) => {
  try {
    req = matchedData(req);
    const template = await DocumentTemplate.findOne({ _id: req.templateId });
    if (template) {
      template.name = req.templateName;
      await template.save();
    }
    res.status(200).json({
      message: 'Template successfully updated.',
      reqs: req
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.notaryTemplateDelete = async (req, res) => {
  try {
    req = matchedData(req);
    const template = await DocumentTemplate.findOne({ _id: req.templateId });
    if (template) {
      const params = {
        Bucket: process.env.AWSBucket,
        Key: template.key
      }
      console.log(params);
      try {
        await s3.headObject(params).promise()
        console.log('File Found in S3')
        try {
          await s3.deleteObject(params).promise()
          console.log('file deleted Successfully')
        } catch (err) {
          console.log('ERROR in file Deleting : ' + JSON.stringify(err))
        }
      } catch (err) {
        console.log('File not Found ERROR : ' + err)
      }
      await template.remove();
    }
    res.status(200).json({
      message: 'Template successfully removed.'
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.saveSealData = async (req, res) => {
  const user = req.user
  req = matchedData(req);
  const isExisting = await NotaryDataModel.exists({
    userId: user._id
  })
  if (!isExisting) {
    const newProxy = new NotaryDataModel({
      sealdata: req.base64,
      sealfilename: req.filename,
      userId: user._id,
      email: user.email,
      dcpassword: 'bnDCpwd21'
    })
    await newProxy.save()
    res.status(200).json({ message: 'Seal image uploaded successfully.' });
  } else {
    const newProxy = await NotaryDataModel.findOne({ userId: user._id })
    newProxy.sealdata = req.base64
    newProxy.sealfilename = req.filename
    newProxy.userId = user._id
    newProxy.email = user.email
    await newProxy.save()
    res.status(200).json({ message: 'Seal image uploaded successfully.' });
  }
}
exports.saveDocumentTemplate = async (req, res) => {
  const user = req.user;
  const file = req.file;
  req = matchedData(req);
  const template = new DocumentTemplate({
    type: 'custom',
    documentUrl: file.location,
    name: file.key,
    key: file.key,
    bucketname: file.bucket,
    uploadedBy: user._id
  });
  await template.save();
  res.status(200).json({ message: 'Template successfully saved.' });
}
exports.saveSealFile = async (req, res) => {
  const user = req.user;
  const file = req.file;
  req = matchedData(req);
  const isExisting = await NotaryDataModel.exists({
    userId: user._id
  })
  if (!isExisting) {
    const newProxy = new NotaryDataModel({
      sealdata: file.location,
      sealfilename: file.originalname,
      userId: user._id,
      email: user.email,
      dcpassword: 'bnDCpwd21'
    })
    await newProxy.save()
    res.status(200).json({ message: 'Seal image uploaded successfully.', file: file.location });
  } else {
    const newProxy = await NotaryDataModel.findOne({ userId: user._id })
    newProxy.sealdata = file.location;
    newProxy.sealfilename = file.originalname;
    newProxy.userId = user._id
    newProxy.email = user.email
    await newProxy.save()
    res.status(200).json({ message: 'Seal image uploaded successfully.', file: file.location });
  }
}
exports.saveNotaryDetailData = async (req, res) => {
  try {

    const user = req.user;
    req = matchedData(req);
    const data = req.data;
    console.log('Notary controller api ', user, data);

    let email = user.email;
    let sealData;
    const {spawn} = require('child_process');
    const template = path.resolve('./public/templates/' + data.state + '.jpg');
    const python = spawn('python3', [
      path.resolve('./scripts/alter_seal_template.py'),
      data.state,
      user.name,
      data.commissionNumber,
      data.commissionExpiresOn,
      template
    ]);
    await new Promise( (resolve) => {
      python.on('close', resolve)
    })
    const sealFile = path.resolve('./public/templates/seal-' + data.commissionNumber + '.jpg');
    const fileContent = fs.readFileSync(sealFile);
    const params = {
      Bucket: process.env.AWSBucket,
      Key: Date.now().toString() + 'seal-' + data.commissionNumber + '.jpg',
      Body: fileContent,
      ACL: 'public-read'
    };
    try {
      sealData = await s3.upload(params).promise()
      fs.unlinkSync(sealFile);
    } catch (err) {
      console.log(err)
    }
    if (sealData) {
      if (data.email && data.email.length) {
        email = data.email;
      }
      const isExisting = await NotaryDataModel.exists({
        userId: user._id
      });
      console.log('notary data :', isExisting);
      const notaryUser = await User.findOne({_id: user._id});
      if (notaryUser) {
        notaryUser.first_name = data.first_name;
        notaryUser.last_name = data.last_name;
        notaryUser.name = data.name;
        notaryUser.commissionNumber = data.commissionNumber;
        notaryUser.state = data.state;
        await notaryUser.save();
      }
      console.log('notaryUser spi.ts 643', notaryUser);

      if (!isExisting) {
        const newProxy = new NotaryDataModel({
          commissionExpiresOn: data.commissionExpiresOn,
          dcpassword: data.dcpassword,
          sealdata: sealData.location,
          sealfilename: sealData.key,
          userId: user._id,
          email
        });
        await newProxy.save();
        res.status(200).json(newProxy);
      } else {
        const newProxy = await NotaryDataModel.findOne({ userId: user._id });
        console.log('user:', newProxy);

        newProxy.commissionExpiresOn = data.commissionExpiresOn;
        newProxy.dcpassword = data.dcpassword;
        newProxy.sealdata = sealData.Location;
        newProxy.sealfilename = sealData.key;
        newProxy.userId = user._id;
        newProxy.email = email;
        await newProxy.save();
        res.status(200).json(newProxy);
      }
    } else {
      res.status(500).json({ message: 'Unable to generate notary seal.' })
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.connectStripe = async (req, res) => {
  try {
    const user = req.user;
    req = matchedData(req);
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    if (!notarydm) {
      return res.status(400).json({
        error: true,
        errorMessage: 'Notary Data not found'
      })
    }
    let stripeAccountName = '';
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    if (notarydm.stripeAccountName) {
      stripeAccountName = notarydm.stripeAccountName
    } else {
      const stripeResponse = await stripeToUse.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: {requested: true},
          transfers: {requested: true}
        },
        business_profile: {
          // url: 'http://localhost:8080',
          url: 'https://app.bluenotary.us',
          mcc: 5045
        }
      });
      if (stripeResponse && stripeResponse.id) {
        stripeAccountName = stripeResponse.id
      }
      console.log('stripeResponse')
      console.log(stripeResponse)
      console.log('stripeAccountName')
      console.log(stripeAccountName)
      notarydm.stripeAccountName = stripeAccountName
      await notarydm.save()
    }

    let stripeAccountLink = '';
    // if (notarydm.stripeAccountLink) {
    //   stripeAccountLink = notarydm.stripeAccountLink
    // } else {
    let refreshUrl = 'https://app.bluenotary.us/notary/account-settings?stripeConfirmation=failure'
    let returnUrl = 'https://app.bluenotary.us/notary/account-settings?stripeConfirmation=success'
    if (process.env.NODE_ENV === 'development') {
      refreshUrl = 'http://localhost:8080/notary/account-settings?stripeConfirmation=failure'
      returnUrl = 'http://localhost:8080/notary/account-settings?stripeConfirmation=success'
    }
    const stripeResponse2 = await stripeToUse.accountLinks.create({
      account: stripeAccountName,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });
    console.log('stripeResponse2', stripeResponse2)
    stripeAccountLink = stripeResponse2.url
    notarydm.stripeAccountLink = stripeAccountLink
    notarydm.stripeAccountLinkValidTill = stripeResponse2.expires_at
    await notarydm.save()
    // }
    console.log(stripeAccountLink)
    res.status(200).json({
      success: true,
      stripeAccountLink
    });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.deleteSessionItem = async (req, res) => {
  try {
    req = matchedData(req);
    const item = await NewSessionModel.findOne({ sessionid: req.sessionId });
    const document = await DocumentModel.findOne({ sessionid: item._id, _id: req.documentId });
    console.log(item)
    if (document) {
      const params = {
        Bucket: process.env.AWSBucket,
        Key: document.key
      }

      try {
        await s3.headObject(params).promise()
        console.log('File Found in S3')
        try {
          await s3.deleteObject(params).promise()
          console.log('file deleted Successfully')
        } catch (err) {
          console.log('ERROR in file Deleting : ' + JSON.stringify(err))
        }
      } catch (err) {
        console.log('File not Found ERROR : ' + err)
      }
      await document.remove();
    }
    const deleted = await NewSessionModel.deleteOne({ sessionid: req.sessionId })

    console.log(deleted);
    const sessions = await NewSessionModel.find({ sessionid: item.sessionid })
    res.status(200).json(sessions);
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.deleteSessionDocument = async (req, res) => {
  try {
    req = matchedData(req);
    const document = await DocumentModel.findOne({ sessionid: req.sessionId, _id: req.documentId });
    if (document) {
      const params = {
        Bucket: process.env.AWSBucket,
        Key: document.key
      }

      try {
        await s3.headObject(params).promise()
        console.log('File Found in S3')
        try {
          await s3.deleteObject(params).promise()
          console.log('file deleted Successfully')
        } catch (err) {
          console.log('ERROR in file Deleting : ' + JSON.stringify(err))
        }
      } catch (err) {
        console.log('File not Found ERROR : ' + err)
      }
      await document.remove();
    }

    const session = await NewSessionModel.findOne({ _id: req.sessionId });
    const otherDocument = await DocumentModel.findOne({ sessionid: req.sessionId });
    if (!otherDocument) {
      session.originalDocumentId = null
    }
    if (session.originalDocumentIds) {
      session.originalDocumentIds = _.filter(session.originalDocumentIds, (tempDocumentId) => {
        return tempDocumentId !== req.documentId
      })
    }
    await session.save();
    res.status(200).json({session, document: [] });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.saveSessionData = async (req, res) => {
  try {

    // const user = req.user

    // const data = {
    //   sessionOpenCallForTaking: true
    // }
    const data = req.body && req.body.data || false;
    if (!data) {
      return res.status(400).json({error: 'Data Not Found' });
    }
    // req = matchedData(req);
    const session = await NewSessionModel.findOne({ _id: req.params.id });
    console.log(session)
    console.log(data, data.sessionOpenCallForTaking)
    if (data.notorizationTiming) {
      session.notorizationTiming = data.notorizationTiming;
      if (data.meetingdate) {
        session.meetingdate = data.meetingdate
        if (data.meetingTimeZone && session.notorizationTiming === 'notarize_later') {
          session.meetingTimeZone = data.meetingTimeZone
          let currentTimeZoneOffset = parseFloat(String((new Date()).getTimezoneOffset() / 60))
          if (data.currentTimeZone) {
            currentTimeZoneOffset = parseFloat(String(data.currentTimeZone))
          }
          const currentMeetingTimeZone = parseFloat(data.meetingTimeZone)
          const finalOffset = (currentMeetingTimeZone - currentTimeZoneOffset) * 60
          session.meetingdatetimeobj = moment(data.meetingdate, 'YYYY-MM-DD hh:mm A').utcOffset(finalOffset, true)
        } else {
          session.meetingdatetimeobj = moment(data.meetingdate, 'YYYY-MM-DD hh:mm A')
        }
      }
    }
    if (data.sessionOpenCallForTaking) {
      if (session.notorizationTiming === 'notarize_later' && !session.notaryUserId) {
        session.sessionOpenCallForTaking = true
        session.sessionOpenCallForTakingAt = new Date();
        const shortSessionID = (req.params.id).toString().substr((req.params.id).toString().length - 5).toUpperCase();
        if (!req.user.testingacc) {
          emailer.sendEmailToAllNotaries(shortSessionID);
        }
      }
      if (session.multiSignerList) {
        _.map(session.multiSignerList, async (signerDoc) => {
          console.log(signerDoc)
          const email = signerDoc.email;
          let userDoc = await User.findOne({
            email,
            role: 'customer'
          })
          if (!userDoc) {
            userDoc = new User({
              name: 'Additional Signer',
              first_name: 'Additional',
              last_name: 'Signer',
              email,
              password: utils.generateRandomPassword(6),
              verification: uuid.v4(),
              role: 'customer',
              state: '',
              verified: true,
              testingacc: req.user.testingacc || false
            });
            await userDoc.save();
          }
          console.log('userDoc', userDoc)
          emailer.sendEmailToAdditionalSignerWhenInvitedToSession(userDoc, userDoc.password,
            session.meetingdatetimeobj, req.params.id);
        })
      }
    }
    if (data.sessionOpenCallForTaking) {
      session.maxWitnessJoined = data.maxWitnessJoined
    }
    if (data.multiSignerList) {
      session.multiSignerList = data.multiSignerList
    }
    await session.save()
    res.status(200).json({ success: true });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.pickUpSession = async (req, res) => {
  try {

    // const user = req.user

    const data = req.body && req.body.data || false;
    if (!data) {
      return res.status(400).json({errors: {msg: 'Data Not Found' }});
    }
    // req = matchedData(req);
    const session = await NewSessionModel.findOne({ _id: req.params.id });
    console.log('sessionold', session)
    if (!session.sessionOpenCallForTaking) {
      return res.status(400).json({errors: {msg: 'Session Already picked by Other Notary'}})
    }
    session.sessionOpenCallForTaking = false;
    session.sessionOpenCallForTakingAt = null;
    session.notaryUserId = req.user.id;
    session.status = 'ready to sign';
    console.log('sessionnew', session)
    const userDoc = await User.findOne({
      _id: session.userId
    })
    const shortSessionID = (session._id).toString().substr((session._id).toString().length - 5).toUpperCase();
    emailer.sendEmailToCustomerRegardingSessionPicked(userDoc, session.meetingdatetimeobj, shortSessionID);
    await session.save()
    res.status(200).json({ success: true });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.savePersonalData = async (req, res) => {
  try {

    const user = req.user

    req = matchedData(req);
    console.log('uploadFile:', req)
    const data = req.data

    const isExisting = await IdentityModel.exists({ sessionid: req.sessionId, userId: user._id })
    if (!isExisting) {
      let additionalSigner = false;
      if (req.additionalSigner) {
        additionalSigner = true
      }
      const newProxy = new IdentityModel({
        sessionid: req.sessionId,
        firstName: data.firstName,
        middelName: data.middelName,
        lastName: data.lastName,
        userSsn: data.userSsn,
        userZipCode: data.userZipCode,
        userState: data.userState,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        userId: user._id,
        email: user.email,
        additionalSigner
      })
      await newProxy.save()
      res.status(200).json({ message: 'Your information saved successfully for this session.' });
    } else {
      const newProxy = await IdentityModel.findOne({ sessionid: req.sessionId, userId: user._id })
      newProxy.firstName = data.firstName
      newProxy.middelName = data.middelName
      newProxy.lastName = data.lastName
      newProxy.userSsn = data.userSsn
      newProxy.userZipCode = data.userZipCode
      newProxy.userState = data.userState
      newProxy.addressLine1 = data.addressLine1
      newProxy.addressLine2 = data.addressLine2
      newProxy.birthdate = data.birthdate
      newProxy.userId = user._id
      newProxy.email = user.email
      await newProxy.save();
      res.status(200).json({ message: 'Your information saved successfully for this session.' });
    }

    // update session stage
    const session = await NewSessionModel.findOne({_id: req.sessionId});
    if (session.currentStage === 'identity_check_stage') {
    session.currentStage = 'payment_info_stage';
    session.stagesHistory.push({
      stageName: 'Payment Info stage',
      stageDate: new Date()
    });
    session.save();
  }

  // update document stage
    const document = await DocumentModel.findOne({sessionid: session._id});
    if (document && document.uploadedStage === 'identity_check_stage') {
    document.uploadedStage = 'payment_info_stage';
    document.save();
  }
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.loadPersonalData = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    const sessions = await IdentityModel.findOne({ sessionid: req.sessionId, userId: user._id });
    // update session stage
    console.log(sessions)
    const session = await NewSessionModel.findOne({_id: req.sessionId});
    if (session.currentStage === 'initial_stage') {
      session.currentStage = 'identity_check_stage';
      session.stagesHistory.push({
        stageName: 'Identity check stage',
        stageDate: new Date()
      });
      session.save();
    }

    // update document stage
    const document = await DocumentModel.findOne({sessionid: session._id});
    if (document && document.uploadedStage === 'initial_stage') {
      document.uploadedStage = 'identity_check_stage';
      document.save();
    }
    // if (sessions.backPhotoIdKey) {
    //   const url = s3.getSignedUrl('getObject', {
    //       Bucket: process.env.AWSBucket,
    //       Key: sessions.backPhotoIdKey,
    //       Expires: 60 * 60 * 24 * 6
    //   });
    //   sessions.backPhotoIdUrl = url
    // }
    res.status(200).json(sessions);
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.sessiondata = async (req, res) => {
  try {
    const user = req.user
    console.log('user:', user)
    req = matchedData(req);
    const mySessionsQuery = {
      $or: [
        {
          userId: user._id
        },
        {
          multiSignerList: {
            $elemMatch: {
              email: user.email
            }
          }
        }
      ]
    }
    const sessions = await NewSessionModel.find(mySessionsQuery).sort({createdAt: -1});
    const sessionData = [];
    const allAdditionalSignerEmails = []
    let sessionIdentityDocsKeyed = {}
    const allSessionIds = _.map(sessions, '_id')
    for (const item of sessions) {
      if (item.multiSignerList) {
        _.map(item.multiSignerList, (multiSignerDoc) => {
          if (multiSignerDoc.email) {
            allAdditionalSignerEmails.push(multiSignerDoc.email)
          }
        })
      }
    }
    let additionalSignerEmailUserDocMap = {}
    if (allAdditionalSignerEmails.length) {
      const allAdditionalSignerUserDocs = await User.find({
        email: {$in: allAdditionalSignerEmails}
      })
      additionalSignerEmailUserDocMap = _.keyBy(allAdditionalSignerUserDocs, 'email')
    }
    const sessionIdentityDocs = await IdentityModel.find({
      sessionid: {$in: allSessionIds}
    })
    sessionIdentityDocsKeyed = _.groupBy(sessionIdentityDocs, 'sessionid')
    for (const item of sessions) {
      let finalDocumentId = item.finalDocumentId;
      let videoDataId = item.videoFileDocumentId;
      if (item.paid === false) {
        finalDocumentId = ''
        videoDataId = ''
      }
      let finalDocument;
      // if (item.status === 'complete' && item.finalDocumentId) {
      if (finalDocumentId) {
        finalDocument = await DocumentModel.find({ sessionid: item._id,
          documentCategory: 'final_document_with_dc' });
        // finalDocument = await DocumentModel.findOne({ _id: finalDocumentId });
      } else {
        finalDocument = false;
      }
      let videoData;
      if (videoDataId) {
        videoData = await DocumentModel.findOne({ _id: videoDataId });
      } else {
        videoData = false
      }
      const documents = await DocumentModel.find({ sessionid: item._id, documentCategory: 'initial_document' });
      const notary = await User.findOne({_id: item.notaryUserId});
      const allNotaryIdentities = sessionIdentityDocsKeyed[item._id] || []
      const notaries = allNotaryIdentities && allNotaryIdentities[0] || {}
      const additionalSignerIdentyDocs = []
      let currentUserAdditionalSigner = false
      let currentUserAdditionalSignerStage = ''
      _.map(item.multiSignerList, (multiSignerDoc) => {
        if (multiSignerDoc.email === user.email) {
          currentUserAdditionalSigner = true
        }
        const userDoc = additionalSignerEmailUserDocMap[multiSignerDoc.email]
        let identityDocFound = false
        if (userDoc) {
          _.map(allNotaryIdentities, (tempIdentityDoc) => {
            if (String(tempIdentityDoc.userId) === String(userDoc._id)) {
              additionalSignerIdentyDocs.push(tempIdentityDoc)
              identityDocFound = true
              if (multiSignerDoc.email === user.email) {
                currentUserAdditionalSignerStage = tempIdentityDoc.additionalSignerNextStage
              }
            }
          })
        }
        if (!identityDocFound) {
          additionalSignerIdentyDocs.push(multiSignerDoc)
        }
      })
      const sessionJoinedUserLog = await SessionUserLogs.findOne({
        sessionid: item._id,
        actionType : 'join_session'
      })
      let sessionStartedTime = false;
      if (sessionJoinedUserLog) {
        sessionStartedTime = sessionJoinedUserLog.createdAt
      }
      sessionData.push({
        current_session_id: item._id,
        sessionId: item.sessionid,
        currentStage: item.currentStage,
        status: item.status,
        files: documents,
        finalDocument,
        notaries,
        paymentData: false,
        videoData,
        meetingdate: (item.meetingdate) ? item.meetingdate : 'N/A',
        meetingTimeZone: item.meetingTimeZone,
        shotId: (item.sessionid).toString().substr((item.sessionid).toString().length - 5).toUpperCase(),
        session: item,
        notary,
        additionalSignerIdentyDocs,
        currentUserAdditionalSigner,
        currentUserAdditionalSignerStage,
        sessionStartedTime
      })
      // payment data
      // video data
    }
    res.status(200).json(sessionData);
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.getOneSessionFullData = async (req, res) => {
  const sessionid = req.params && req.params.id
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  const newSessionModelData = await NewSessionModel.findOne({
    _id: sessionid
  })
  if (!newSessionModelData) {
    return res.status(404).json({
      error: 'Session doc not found'
    })
  }
  const responseData = {
    newSessionModelData,
    notaryUser: null,
    originalDocument: null,
    allDocumentDocs: null,
    pdfDroppedElementDatas: null,
    customerUser: null,
    notaryDatasDoc: null,
    statePricingDoc: null,
    multiSignerUserDocs: null
  }
  console.log('newSessionModelData.notaryUserId', newSessionModelData.notaryUserId)
  if (!newSessionModelData.notaryUserId) {
    if (req.user.role === 'notary') {
      newSessionModelData.notaryUserId = req.user.id;
      await newSessionModelData.save()
    }
  }

  let sessionWitnessQuery;
  if (req.user.role === 'witness' && req.user.witnessid) {
    sessionWitnessQuery = {
      $or: [
        {
          sessionid,
          userid: req.user._id
        },
        {
          sessionid,
          witnessid: req.user.witnessid
        }
      ]
    }
  } else {
    sessionWitnessQuery = {
      $or: [
        {
          sessionid,
          userid: req.user._id
        }
      ]
    }
  }
  const userAlreadyWitnessInCurrentSession = await SessionWitness.findOne(sessionWitnessQuery)
  console.log(req.user)
  console.log('newSessionModelData', newSessionModelData)
  let userInAdditionalWitnessList = false;
  _.map(newSessionModelData.multiSignerList || [], (signerDoc) => {
    if (signerDoc.email === req.user.email) {
      userInAdditionalWitnessList = true;
    }
  })
  if (!(String(newSessionModelData.userId) === String(req.user.id) ||
    String(newSessionModelData.notaryUserId) === String(req.user.id) ||
    userAlreadyWitnessInCurrentSession || userInAdditionalWitnessList)) {
    return res.status(400).json({
      errors: {
        msg: 'You dont have permission to view this session'
      }
    })
  }
  if (userAlreadyWitnessInCurrentSession && String(newSessionModelData.notaryUserId) !== String(req.user.id) &&
  !req.query.witness) {
    return res.status(400).json({
      errors: {
        msg: 'You dont have permission to view this session as non witness'
      }
    })
  }
  if (newSessionModelData.notaryUserId) {
    const notaryUser = await User.findOne({
      _id: newSessionModelData.notaryUserId
    })
    if (notaryUser) {
      responseData.notaryUser = notaryUser
    }
    const notaryDatasDoc = await NotaryDataModel.findOne({
      userId: newSessionModelData.notaryUserId
    })
    if (notaryDatasDoc) {
      responseData.notaryDatasDoc = notaryDatasDoc
    }
  }
  if (newSessionModelData.userId) {
    let customerUser = await User.findOne({
      _id: newSessionModelData.userId
    })
    if (customerUser) {
      const identityDataResponse = await IdentityModel.findOne({
        userId: customerUser._id,
        sessionid: String(sessionid)
      })
      customerUser = JSON.parse(JSON.stringify(customerUser))
      customerUser.identityData = identityDataResponse
      responseData.customerUser = customerUser
    }
  }
  const originalDocumentId = newSessionModelData.originalDocumentId
  const allDocumentIds = newSessionModelData.originalDocumentIds || []
  if (!_.includes(allDocumentIds, originalDocumentId)) {
    allDocumentIds.push(originalDocumentId)
  }
  const originalDocuments = await DocumentModel.find({
    _id: {$in: allDocumentIds}
  })
  let originalDocument
  _.map(originalDocuments, (tempOriginalDocument) => {
    if (tempOriginalDocument._id === originalDocumentId) {
      originalDocument = tempOriginalDocument
    }
  })
  if (!originalDocument) {
    originalDocument = (originalDocuments && originalDocuments[0]) || {}
  }
  responseData.originalDocument = originalDocument
  responseData.allDocumentDocs = originalDocuments

  const pdfDroppedElementDataDoc = await PDFDroppedElementsModel.findOne({ sessionid });
  responseData.pdfDroppedElementDatas = pdfDroppedElementDataDoc

  const notaryUserDoc = await User.findOne({
    _id: newSessionModelData.notaryUserId
  })
  let stateToUse = 'Others'
  if (notaryUserDoc && notaryUserDoc.state) {
    stateToUse = notaryUserDoc.state
  }
  let pricingDoc = PricingJson.pricing[stateToUse]
  if (!pricingDoc) {
    pricingDoc = PricingJson.pricing.Others
  }
  responseData.statePricingDoc = pricingDoc
  const multiSignerListEmail = _.map(newSessionModelData.multiSignerList || [], 'email')
  if (multiSignerListEmail.length) {
    const multiSignerUserDocs = await User.find({
      email: {$in: multiSignerListEmail}
    })
    const multiSignerIdentitiesModel = await IdentityModel.find({
      sessionid,
      userId: {$in: _.map(multiSignerUserDocs, '_id')}
    })
    const multiginerIdentitesKeyed = _.keyBy(multiSignerIdentitiesModel, 'userId')
    responseData.multiSignerUserDocs = _.map(multiSignerUserDocs, (tempUserDoc) => {
      let currentStage = 'KBA and Photo ID Check Not Completed'
      tempUserDoc = JSON.parse(JSON.stringify(tempUserDoc))
      if (tempUserDoc._id && multiginerIdentitesKeyed[tempUserDoc._id]) {
        tempUserDoc.identityData = multiginerIdentitesKeyed[tempUserDoc._id]
        if (tempUserDoc.identityData.additionalSignerNextStage === 'meet_notary') {
          currentStage = 'KBA and Photo ID Check Successful'
        } else if (tempUserDoc.identityData.additionalSignerNextStage === 'photoid_check_stage') {
          currentStage = 'KBA Successful. Photo ID Check Not Completed'
        }
      }
      tempUserDoc.currentStage = currentStage
      return tempUserDoc
    })
  }
  res.status(200).json(responseData);
};

exports.getCustomerDetailsDuringSessionFlow = async (req, res) => {
  const user = req.user
  const sessionid = req.params && req.params.id;
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  const demo = req.query.demo ? true : false;
  console.log('demo: ',  demo, req.query.demo);
  const finalResponseData = {
    customerUser: null,
    identityDataResponse: null
  }
  const newSessionModelData = await NewSessionModel.findOne({
    _id: sessionid
  })
  if (newSessionModelData.meetingdatetimeobj) {
    console.log(moment(), newSessionModelData.meetingdatetimeobj, moment(newSessionModelData.meetingdatetimeobj),
    moment(newSessionModelData.meetingdatetimeobj).add(parseFloat(newSessionModelData.meetingTimeZone) * 60, 'minutes'),
    newSessionModelData.meetingTimeZone)
    const dateDifferenceInHours = moment().diff(moment(newSessionModelData.meetingdatetimeobj)
    .add(parseFloat(newSessionModelData.meetingTimeZone) * 60, 'minutes'), 'hours');
    console.log('dateDifferenceInHours', dateDifferenceInHours, newSessionModelData.meetingTimeZone)
    if (!(dateDifferenceInHours >= -15 && dateDifferenceInHours <= 15)) {
      return res.status(200).json({
        test: [],
        output: 'Identity Check Outside Time',
        details: {}
      })
    }
  }
  let identityDataResponse = {
    firstName: null,
    lastName: null,
    consumerPlusAPIResponseDoc: null,
    addressLine1: null,
    userZipCode: null,
    userSsn: null,
    birthdate: null
  };
  if (newSessionModelData.userId) {
    const customerUser = await User.findOne({
      _id: newSessionModelData.userId
    })
    if (customerUser) {
      finalResponseData.customerUser = customerUser
    }
    identityDataResponse = await IdentityModel.findOne({
      userId: user._id,
      sessionid: String(sessionid)
    })
    if (identityDataResponse) {
      finalResponseData.identityDataResponse = identityDataResponse;
    } // end check id data response
  }
  const builder = new XMLBuilder();
  if (!(identityDataResponse && identityDataResponse.firstName)) {
    return res.status(400).json({
      error: 'Identities Data Not Found'
    })
  }
  const sessionUserLogsData = new SessionUserLogs({
    sessionid: new mongoose.Types.ObjectId(sessionid),
    userId: new mongoose.Types.ObjectId(newSessionModelData.userId),
    actionType: 'kba_started'
  });
  sessionUserLogsData.save();
  newSessionModelData.kbaStartedAt = new Date()
  newSessionModelData.save()
  const jsObjectToSend = {
    PlatformRequest: {
      Credentials: {
        Username: 'E27368-65DCF76C-B477-4167-83F4-2E63D0690D4C',
        Password: 'nN0Q44tYmykA5ib'
      },
      CustomerReference: 'E27368-65DCF76C-B477-4167-83F4-2E63D0690D4C',
      Identity: {
        FirstName: identityDataResponse.firstName,
        LastName: identityDataResponse.lastName,
        DateOfBirth: moment(identityDataResponse.birthdate, 'YYYY/MM/DD').format('YYYY-MM-DD'),
        // Street: '13584 ST RD 62',
        // ZipCode: '47537',
        // Ssn: '222222222',
        // Ssn: demo ? '444444444' : identityDataResponse.userSsn,
        // Ssn: demo ? '333333333' : identityDataResponse.userSsn,
        Ssn: demo ? '222222222' : identityDataResponse.userSsn,
        Street: identityDataResponse.addressLine1, // TODO : Uncomment when testing is done
        ZipCode: identityDataResponse.userZipCode // TODO : Uncomment when testing is done
        // Ssn: identityDataResponse.userSsn, // TODO : Uncomment when testing is done
      }
    }
  }
  console.log('jsObjectToSend', jsObjectToSend);
  // If we have already fetched the consumer+ api, we will return that reponse from db only
  if (identityDataResponse.consumerPlusAPIResponseDoc) {
    const jObj = identityDataResponse.consumerPlusAPIResponseDoc;
    const tempResponse = jObj.PlatformResponse && jObj.PlatformResponse.Response || {};
    if (tempResponse && tempResponse.Questions && tempResponse.Questions.Question &&
        tempResponse.Questions.Question.length < 10) {
      const newQuestionsNeeded = 10 - tempResponse.Questions.Question.length;
      console.log('newQuestionsNeeded', newQuestionsNeeded)
      for (let i = 0; i < newQuestionsNeeded; i += 1) {
        tempResponse.Questions.Question.push(tempResponse.Questions.Question[i])
      }
    }
    const finalOutput = {
      test: tempResponse,
      output: tempResponse.WorkflowOutcome && tempResponse.WorkflowOutcome.text || 'Fail',
      details: tempResponse.StandardizedAddress || {}
    }
    res.status(200).json(finalOutput)
  } else {
    const newIdentityDataResponse = await IdentityModel.findOne({
      userId: user._id,
      sessionid: String(sessionid)
    });
    const xmlContent = builder.build(jsObjectToSend);
    const finalXMLRequest = '<?xml version="1.0" encoding="utf-8"?>' + xmlContent
    // console.log(xmlContent)
    const evsFillAPIUrl = 'https://identiflo.everification.net/WebServices/Integrated/Main/V220/ConsumerPlus'
    const headers = {'Content-Type': 'application/xml'}
    request.post({url: evsFillAPIUrl, body: finalXMLRequest, headers}, (error, response, body) => {
      const parser = new XMLParser({
        attributeNamePrefix : '@_',
        ignoreAttributes : false,
        ignoreNameSpace: false,
        textNodeName : 'text'
      });
      const jObj = parser.parse(body);
      const tempResponse = jObj.PlatformResponse && jObj.PlatformResponse.Response || {}
      if (newIdentityDataResponse) {
        newIdentityDataResponse.consumerPlusAPIResponseDoc = JSON.parse(JSON.stringify(jObj))
        newIdentityDataResponse.save();
      }
      if (!demo && tempResponse && tempResponse.Questions && tempResponse.Questions.Question) {
        tempResponse.Questions.Question = _.map(tempResponse.Questions.Question, (questionDoc) => {
          if (questionDoc.Answer) {
            questionDoc.Answer = _.map(questionDoc.Answer, (answerDoc) => {
              delete answerDoc['@_correct']
              return answerDoc
            })
          }
          return questionDoc
        })
      }
      if (tempResponse && tempResponse.Questions && tempResponse.Questions.Question &&
        tempResponse.Questions.Question.length < 10) {
        const newQuestionsNeeded = 10 - tempResponse.Questions.Question.length;
        console.log('newQuestionsNeeded', newQuestionsNeeded)
        for (let i = 0; i < newQuestionsNeeded; i += 1) {
          tempResponse.Questions.Question.push(tempResponse.Questions.Question[i])
        }
      }
      const finalOutput = {
        test: tempResponse,
        output: tempResponse.WorkflowOutcome && tempResponse.WorkflowOutcome.text || 'Fail',
        details: tempResponse.StandardizedAddress || {}
      }
      res.status(200).json(finalOutput)
    });
  }
};

exports.getCustomerDetailsAfterChecking = async (req, res) => {
  const user = req.user
  const sessionid = req.params && req.params.id
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  const finalResponseData = {
    customerUser: null,
    identityDataResponse: null
  };
  const newSessionModelData = await NewSessionModel.findOne({
    _id: sessionid
  })
  let identityDataResponse = {
    firstName: null,
    lastName: null,
    frontPhotoIdUrl: null,
    backPhotoIdUrl: null,
    fillAPIResponseDoc: null,
    userSsn: null
  }
  let identityModelQuery
  if (user.role === 'customer') {
    identityModelQuery = {
      sessionid: String(sessionid),
      userId: user._id
    }
  } else {
    identityModelQuery = {
      sessionid: String(sessionid)
    }
  }
  if (newSessionModelData.userId) {
    const customerUser = await User.findOne({
      _id: newSessionModelData.userId
    })
    if (customerUser) {
      finalResponseData.customerUser = customerUser
    }
    identityDataResponse = await IdentityModel.findOne(identityModelQuery)
    if (identityDataResponse) {
      finalResponseData.identityDataResponse = identityDataResponse
    }
  }
  if (!(identityDataResponse && identityDataResponse.firstName)) {
    return res.status(400).json({
      error: 'Identities Data Not Found'
    })
  }

  console.log(identityDataResponse)

  let fetchDataFromFillApi = process.env.NODE_ENV !== 'development';
  if (identityDataResponse.fillAPIResponseDoc) {
    fetchDataFromFillApi = false
  }
  const demo = req.query.demo ? true : false;
  console.log('demo: ',  demo, req.query.demo);
  if (demo && demo === true) {
    fetchDataFromFillApi = false;
  }
  // const fetchDataFromFillApi = true;

  if (!fetchDataFromFillApi) {
    let apiResponse = {
      '?xml': '',
      'PlatformResponse': {
        TransactionDetails: {
          TransactionId: 63917683,
          TransactionDate: '2022-03-23T04:22:02.163',
          Product: '',
          CustomerReference: 'E27368-5C86555C-51B1-4175-B5EA-DDD6B7852F02',
          DataProviderDuration: 3.06,
          TotalDuration: 12.2788135,
          Errors: '',
          Warnings: { Warning: [ '', '' ] }
        },
        Response: {
          WorkflowOutcome: 'Pass',
          ParseResult: {
            DocumentValidationResult: 'Successfully processed the image and the document appears valid.',
            DocumentExpirationResult: 'The document has not expired.',
            ParsedName: {
              FullName: 'ANDREW RYAN AYER',
              NamePrefix: '',
              FirstName: 'ANDREW',
              MiddleName: 'RYAN',
              LastName: 'AYER',
              NameSuffix: ''
            },
            ParsedAddress: {
              Address1: '1358asdf4 N STATEasdf RsadfAD 62',
              Address2: '',
              City: 'GENTRsadfYVIasdfLLE',
              JurisdictionCode: 'IN',
              PostalCode: '4732537-0000',
              CountryCode: 'USA',
              Country: 'United States of America'
            },
            ParsedDescription: {
              DateOfBirth: '1900-06-05',
              Age: 17,
              Gender: 'Male',
              EyeColor: 'Brown',
              HairColor: 'Brown',
              Race: '',
              Height: '076 IN',
              WeightKg: 84,
              WeightLbs: 185,
              Veteran: '',
              OrganDonor: 'True'
            },
            ParsedDocumentInfo: {
              LicenseNumber: '1822220-05-2403',
              DocumentType: 'DL',
              IssuerIdentificationNumber: 636037,
              IssuedBy: 'IN',
              IssueDate: '3020-11-19',
              ExpirationDate: '3027-06-05',
              CardRevisionDate: '3018-07-24',
              ClassificationCode: '',
              ComplianceType: 'F',
              LimitedDurationDocument: '',
              HazmatExpDate: '',
              EndorsementsCode: '',
              EndorsementCodeDescription: '',
              RestrictionCode: '',
              RestrictionCodeDescription: '',
              VehicleClassCode: '',
              VehicleClassCodeDescription: ''
            }
          },
          PrimaryResult: '',
          CheckpointScore: '',
          AuthenticationScore: '',
          ValidationScore: '',
          VerificationScore: '',
          NameFlipIndicator: '',
          AddressVerificationResult: 'Exact match on first and last name; Exact match on address',
          AddressUnitMismatchResult: '',
          AddressTypeResult: 'Submitted address is residential address.',
          AddressHighRiskResult: 'No address high risk information found for submitted address.',
          PhoneVerificationResult: 'Phone number was not entered on search request.',
          PhoneUnitMismatchResult: '',
          PhoneHighRiskResult: 'No phone high risk information found.',
          ChangeOfAddressResult: 'No change of address information was found.',
          DriverLicenseResult: 'DL number not submitted.',
          DriverLicenseFormat: '',
          SocialSecurityNumberResult: 'Match to full name and address using Social Security Number.',
          DateOfBirthResult: 'DOB not on input.',
          ExclusionCondition: '',
          EmailVerificationResult: 'Match to Name associated with Email in repository',
          EmailValidationResult: 'Possible valid email address',
          EmailReasonResult: 'No Failure Identified – the email had proper syntax and domain',
          EmailRepositoryResult: 'Email address found in repository',
          MinorResult: 'The matched consumer is an adult.',
          ReportedFraudResult: 'No fraud has been reported for the matched consumer',
          StandardizedAddress: {
            LastName: 'SMsadfITdsafH',
            FirstName: 'JasdfOasdfHN',
            MiddleInitial: '',
            Street: '1asdfdsf3 MasdfasAIN ST',
            City: 'LOUISdfsadfasdfVILLE',
            State: 'KasdfY',
            ZipCode: 11111,
            ZipPlusFour: 2222
          },
          DateOfBirth: '',
          HighRiskPhoneMatches: '',
          HighRiskAddressMatches: '',
          ConsumerIdDetail: {
            LastName: 'SMsadfasdfIasdfH',
            FirstName: 'asdfasdfOHasdfN',
            MiddleInitial: '',
            Street: '12asdf3 MsadfsdfAINsadf ST',
            City: 'LOasdfUIasdfSVIsadfLLE',
            State: 'KY',
            ZipCode: 11111,
            ZipPlusFour: 2222,
            AreaCode: '',
            Phone: '',
            DateOfBirth: '',
            DateOfBirthResult: '',
            ReportedDate: { Day: 16, Month: 11, Year: 2012 },
            LastTouchedDate: { Day: 1, Month: 9, Year: 2015 }
          },
          SsnFinderDetails: '',
          ResidentialPhoneDetails: '',
          ResidentialAddressDetails: {
            ResidentialAddressDetail: [
              {
                LastName: 'SasasdfasdfMITasdfasdfH',
                FirstName: 'JasasdffOHasdfsadfN',
                MiddleInitial: 'R',
                AliasName: '',
                Street: '1asdfasdfasdf2saasdff3asdfsadf MAINsadasdff ST',
                City: 'asdfasdfasdf',
                State: 'KsasdfasdfadfY',
                ZipCode: 11111,
                ZipPlusFour: 2222,
                AreaCode: 333,
                Phone: 0,
                SpouseName: '',
                LastTouchedDate: { Day: 2, Month: 11, Year: 2015 },
                ReportedDate: '',
                ResidenceLength: 47
              },
              {
                LastName: 'SdfasdfMITasdfasdasH',
                FirstName: 'JOadsfasdfasdfHN',
                MiddleInitial: '',
                AliasName: '',
                Street: '1aasdfasdfdssadff23 asadfsdfasdfMAIN STasdfasdf',
                City: 'LOUdfasdfasdfISVasdfILLE',
                State: 'asdfasdfasdf',
                ZipCode: 21111,
                ZipPlusFour: 2222,
                AreaCode: '',
                Phone: '',
                SpouseName: '',
                LastTouchedDate: { Day: 1, Month: 9, Year: 2015 },
                ReportedDate: '',
                ResidenceLength: ''
              }
            ]
          }
        }
      }
    }
    if (identityDataResponse.fillAPIResponseDoc) {
      apiResponse = identityDataResponse.fillAPIResponseDoc
    }
    console.log(apiResponse)
    const responseDoc = apiResponse && apiResponse.PlatformResponse && apiResponse.PlatformResponse.Response || false;
    if (!responseDoc) {
      res.status(200).json({
        workflowOutcome: 'Fail',
        reason: 'No Idea'
      })
    }
    const allDetails = []
    const finalResponse = {
      allDetail: null,
      workflowOutcome: responseDoc && responseDoc.WorkflowOutcome ? responseDoc.WorkflowOutcome : '',
      documentValidationResult: responseDoc && responseDoc.ParseResult
        && responseDoc.ParseResult.DocumentValidationResult || '',
      documentExpirationResult: responseDoc && responseDoc.ParseResult
        && responseDoc.ParseResult.DocumentExpirationResult || '',
      frontPhotoUrl: identityDataResponse.frontPhotoIdUrl || false,
      backPhotoUrl: identityDataResponse.backPhotoIdUrl || false
    }
    _.map(responseDoc && responseDoc.ParseResult, (resultValue, resultKey) => {
      if (['DocumentValidationResult', 'DocumentExpirationResult'].indexOf(resultKey) !== -1) {
        return
      }
      _.map(resultValue, (innerResultValue, innerResultKey) => {
        if (!innerResultValue) {
          return
        }
        allDetails.push({
          displayName: innerResultKey.replace(/([A-Z])/g, ' $1').trim(),
          group: resultKey.replace(/([A-Z])/g, ' $1').trim(),
          value: innerResultValue
        })
      })
    })
    finalResponse.allDetail = allDetails
    res.status(200).json(finalResponse)
  } else {
    const builder = new XMLBuilder();
    const newIdentityDataResponse = await IdentityModel.findOne(identityModelQuery);
    const backPhotoIdUrl = newIdentityDataResponse.backPhotoIdUrl.replace(/^https:\/\//i, 'http://');
    // const backPhotoIdUrl = 'http://bluenotarybucket.s3.us-east-2.amazonaws.com/1649582404008IMG_0467.jpg' // correct
    // const backPhotoIdUrl = 'http://bluenotarybuckey2.s3.us-east-2.amazonaws.com/1653009984695image.jpg' // incorect
    http.get(backPhotoIdUrl, (resp) => {
      resp.setEncoding('base64');
      let fileData = '';
      resp.on('data', (data) => {
        fileData += data;
      });
      resp.on('end', async () => {
        const sharpImage = await sharp(Buffer.from(fileData, 'base64')).resize({ width: 1500 }).toBuffer();
        const finalFileData = sharpImage.toString('base64')
        const jsObjectToSend = {
            PlatformRequest: {
              Credentials: {
                Username: 'E27368-65DCF76C-B477-4167-83F4-2E63D0690D4C',
                Password: 'nN0Q44tYmykA5ib'
              },
              CustomerReference: 'E27368-5C86555C-51B1-4175-B5EA-DDD6B7852F02',
              Identity: {
                ScanMode: 'DirectImageUpload',
                BackImage: finalFileData
              }
            }
          }
        const xmlContent = builder.build(jsObjectToSend);
        const evsFillAPIUrl = 'https://identiflo.everification.net/WebServices/Integrated/Main/V220/Fill'
        const headers = {'Content-Type': 'application/xml'}
        request.post({url: evsFillAPIUrl, body: xmlContent, headers}, (error1, response1, body1) => {
            const parser = new XMLParser();
            const apiResponse = parser.parse(body1);
            console.log(util.inspect(apiResponse, {showHidden: false, depth: null, colors: true}))
            const responseDoc = apiResponse && apiResponse.PlatformResponse
              && apiResponse.PlatformResponse.Response || false;
            if (newIdentityDataResponse) {
              newIdentityDataResponse.fillAPIResponseDoc = apiResponse;
              newIdentityDataResponse.save();
            }
            if (!responseDoc) {
              res.status(200).json({
                workflowOutcome: 'Fail',
                reson: 'No Idea'
              })
            }
            const allDetails = []
            const finalResponse = {
              allDetail: null,
              workflowOutcome: responseDoc && responseDoc.WorkflowOutcome ? responseDoc.WorkflowOutcome : '',
              documentValidationResult: responseDoc && responseDoc.ParseResult
                && responseDoc.ParseResult.DocumentValidationResult || '',
              documentExpirationResult: responseDoc && responseDoc.ParseResult
                && responseDoc.ParseResult.DocumentExpirationResult || '',
              frontPhotoUrl: identityDataResponse.frontPhotoIdUrl || false,
              backPhotoUrl: identityDataResponse.backPhotoIdUrl || false
            }
            _.map(responseDoc && responseDoc.ParseResult, (resultValue, resultKey) => {
              if (['DocumentValidationResult', 'DocumentExpirationResult'].indexOf(resultKey) !== -1) {
                return
              }
              _.map(resultValue, (innerResultValue, innerResultKey) => {
                if (!innerResultValue) {
                  return
                }
                allDetails.push({
                  displayName: innerResultKey.replace(/([A-Z])/g, ' $1').trim(),
                  group: resultKey.replace(/([A-Z])/g, ' $1').trim(),
                  value: innerResultValue
                })
              })
            })
            finalResponse.allDetail = allDetails
            res.status(200).json(finalResponse)
          });
          // return res.json({result: body, status: 'success'});
      });
    }).on('error', (e) => {
      res.status(400).json({
        error: e.message
      })
      // console.log(`Got error: ${e.message}`);
    });
  }
};

exports.verifyCustomerAnswersDuringSessionFlow = async (req, res) => {
  const user = req.user
  const sessionid = req.params && req.params.id;
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  req = matchedData(req);

  const finalResponseData = {
    customerUser: null,
    identityDataResponse: null
  }
  const newSessionModelData = await NewSessionModel.findOne({
    _id: sessionid
  })
  let identityDataResponse = {
    firstName: null,
    lastName: null,
    consumerPlusAPIResponseDoc: null
  };
  if (newSessionModelData.userId) {
    const customerUser = await User.findOne({
      _id: newSessionModelData.userId
    })
    if (customerUser) {
      finalResponseData.customerUser = customerUser
    }
    identityDataResponse = await IdentityModel.findOne({
      userId: user._id,
      sessionid: String(sessionid)
    })
    if (identityDataResponse) {
      finalResponseData.identityDataResponse = identityDataResponse
    }
  }
  if (!identityDataResponse.firstName) {
    return res.status(400).json({
      error: 'Identities Data Not Found'
    })
  }
  const sessionUserLogsData = new SessionUserLogs({
    sessionid: new mongoose.Types.ObjectId(sessionid),
    userId: new mongoose.Types.ObjectId(newSessionModelData.userId),
    actionType: 'kba_answered',
    kbaAnswers: req.answers
  });
  sessionUserLogsData.save();
  const diff = new Date().valueOf() - newSessionModelData.kbaStartedAt.valueOf()
  const minutesDifference = diff / (60 * 1000)
  console.log('minutesDifference', minutesDifference)
  let kbaInTime = true;
  if (minutesDifference >= 2) {
    kbaInTime = false;
  }
  if (!kbaInTime) {
    return res.status(200).json({
      // status: response.every(value => value === 'true'),
      status: false,
      kbaTimeOver: true
    })
  }
  if (identityDataResponse.consumerPlusAPIResponseDoc) {
    const jObj = identityDataResponse.consumerPlusAPIResponseDoc;
    const tempResponse = jObj.PlatformResponse && jObj.PlatformResponse.Response || {};
    const questionBlockValue = req.questionBlock;
    // if (_.isObject(questionBlockValue) && questionBlockValue && questionBlockValue.value) {
    //   questionBlockValue = questionBlockValue.value
    // }
    if (tempResponse && tempResponse.Questions && tempResponse.Questions.Question &&
      tempResponse.Questions.Question.length < 10) {
      const newQuestionsNeeded = 10 - tempResponse.Questions.Question.length;
      console.log('newQuestionsNeeded', newQuestionsNeeded)
      for (let i = 0; i < newQuestionsNeeded; i += 1) {
        tempResponse.Questions.Question.push(tempResponse.Questions.Question[i])
      }
    }
    let startIndex = 0;
    if (questionBlockValue === 'B') {
      startIndex = 5;
    }
    const response = [];
    for ( let i = 0; i < 5; i += 1) {
      const currentQuestion = tempResponse.Questions.Question[i + startIndex];
      currentQuestion.Answer.forEach((answer) => {
        if (answer.text === req.answers[i]) {
          response[i] = answer['@_correct'];
          return;
        }
      });
    }
    const totalCorrectAnswersToPass = 4;
    const finalOutput = {
      // status: response.every(value => value === 'true'),
      status: response.filter((value) => value === 'true').length >= totalCorrectAnswersToPass,
      response,
      totalCorrectAnswersToPass
    }
    if (questionBlockValue === 'A' && finalOutput.status) {
      const sessionUserLogsData2 = new SessionUserLogs({
        sessionid: new mongoose.Types.ObjectId(sessionid),
        userId: new mongoose.Types.ObjectId(newSessionModelData.userId),
        actionType: 'kba_succeeded'
      });
      sessionUserLogsData2.save();
    } else if (questionBlockValue === 'A' && !finalOutput.status) {
      const sessionUserLogsData2 = new SessionUserLogs({
        sessionid: new mongoose.Types.ObjectId(sessionid),
        userId: new mongoose.Types.ObjectId(newSessionModelData.userId),
        actionType: 'kba_first_set_failed'
      });
      sessionUserLogsData2.save();
    } else if (questionBlockValue === 'B' && finalOutput.status) {
      const sessionUserLogsData2 = new SessionUserLogs({
        sessionid: new mongoose.Types.ObjectId(sessionid),
        userId: new mongoose.Types.ObjectId(newSessionModelData.userId),
        actionType: 'kba_succeeded'
      });
      sessionUserLogsData2.save();
    } else if (questionBlockValue === 'B' && !finalOutput.status) {
      const sessionUserLogsData2 = new SessionUserLogs({
        sessionid: new mongoose.Types.ObjectId(sessionid),
        userId: new mongoose.Types.ObjectId(newSessionModelData.userId),
        actionType: 'kba_failed'
      });
      sessionUserLogsData2.save();
    }
    res.status(200).json(finalOutput)
  }
};

exports.savePDFEditingPage = async (req, res) => {
  let droppedElements = req.body && req.body.droppedElements || [];
  let droppedElementsDocIdWise = req.body && req.body.droppedElementsDocIdWise || {};
  const sessionid = req.params && req.params.id
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  console.log(req.body);
  const newSessionModelData = await NewSessionModel.findOne({
    _id: sessionid
  })
  newSessionModelData.attachCertificate = req.body.attachCertificate;
  newSessionModelData.notorizationType = req.body.notorizationType;
  newSessionModelData.costOfNotarization = req.body.costOfNotarization;
  newSessionModelData.finalCostOfNotarization = req.body.finalCostOfNotarization;
  newSessionModelData.emptyPagesAdded = req.body.emptyPagesAdded;
  if (req.body.emptyPagesAddedDocIdWise) {
    newSessionModelData.emptyPagesAddedDocIdWise = req.body.emptyPagesAddedDocIdWise;
  }
  await newSessionModelData.save()
  let pdfDroppedElementsDoc = await PDFDroppedElementsModel.findOne({ sessionid });
  if (!pdfDroppedElementsDoc) {
    pdfDroppedElementsDoc = new PDFDroppedElementsModel({ sessionid })
  }
  if (_.isString(droppedElements)) {
    droppedElements = JSON.parse(droppedElements);
  }
  pdfDroppedElementsDoc.droppedElements = droppedElements
  if (_.isString(droppedElementsDocIdWise)) {
    droppedElementsDocIdWise = JSON.parse(droppedElementsDocIdWise)
  }
  pdfDroppedElementsDoc.droppedElementsDocIdWise = droppedElementsDocIdWise
  await pdfDroppedElementsDoc.save()
  res.status(200).json({ success: true })
};

exports.pdfEditsFinalDocumentSave = async (req, res) => {
  const file = req.file
  const user = req.user
  const filename = req.body.filename
  const lastDocument = req.body.lastDocument || false
  console.log('lastDocument', lastDocument)
  const originalDocumentId = req.body.originalDocumentId
  const sessionid = req.params && req.params.id
  req = matchedData(req);
  const sessions = await NewSessionModel.findOne({ _id: sessionid });
  try {
    if (file) {
      // Create Document First
      const tempDocumentDoc = {
        sessionid,
        documentCategory: 'final_document',
        name: filename,
        url: file.location,
        type: file.mimetype,
        size: file.size,
        key: file.key,
        bucketName: file.bucket,
        uploadedBy: user.id,
        uploadedStage: 'meet_notary_stage',
        originalDocumentId: null
      }
      if (originalDocumentId) {
        tempDocumentDoc.originalDocumentId = originalDocumentId
      }
      const uploadedDocument = new DocumentModel(tempDocumentDoc);
      const uploadedDocumentDoc = await uploadedDocument.save();

      sessions.finalDocumentId = uploadedDocumentDoc._id;
      sessions.status = 'complete';
      sessions.stagesHistory.push({
        stageName: 'Session Complete',
        stageDate: new Date()
      });
      await sessions.save();
      const notaries = await IdentityModel.findOne({ sessionid });
      console.log('notaries', notaries)

      // Sign DC
      // get P12 file
      const notaryDatasDoc = await NotaryDataModel.findOne({
        userId: sessions.notaryUserId
      })
      // get the Notary
      const notaryUser = await User.findOne({
        _id: sessions.notaryUserId
      })
      // Sign with the existing p12
      const notaryData = {
        notaryUserId: notaryUser.id,
        contactInfo: notaryUser.email,
        name: notaryUser.name,
        location: (notaryDatasDoc && notaryDatasDoc.county) || 'US',
        dcPassword: (notaryDatasDoc && notaryDatasDoc.dcpassword) || 'bnDCpwd21'
      }
      console.log('notaryDatasDoc', notaryDatasDoc)
      // Sign with the existing p12
      if (notaryDatasDoc && notaryDatasDoc.certfileUrl) {
        await signDocument(uploadedDocumentDoc.key,
            notaryDatasDoc.fileKey,
            sessionid,
            'Signed Certificate By Blue Notary.',
            notaryData);
      } else { // generate new p12
        const p12 = require('node-openssl-p12').createClientSSL;
        const clientFileName = `client_${sessionid}`
        const p12options = {
          clientFileName,
          bitSize: 2048,
          C: 'US', // Country Name (2 letter code)
          ST: notaryUser.state || 'Illinois', // State or Province Name (full name)
          L: notaryUser.state || 'Chicago', // Locality Name (eg, city)
          O: 'Blue Notary LLC', // Organization Name (eg, company)
          OU: notaryUser.state || 'Illinois', // Organizational Unit Name (eg, section)
          CN: notaryUser.name, // Common Name (eg, fully qualified host name)
          emailAddress: notaryUser.email, // Notary Email
          clientPass: (notaryDatasDoc && notaryDatasDoc.dcpassword) || 'bnDCpwd21', // DC password
          caFileName: 'ca',
          serial: '01',
          days: 365
        };
        const p12FilePath = path.join( process.cwd(), 'ssl', `${clientFileName}.p12`)
        if (fs.existsSync(p12FilePath)) {
          fs.unlinkSync(p12FilePath)
        }

        // generate p12 for notary
        await p12(p12options).done((options, sha1fingerprint) => {
          console.log('SHA-1 fingerprint:', sha1fingerprint);
          console.log('options:', options);
        }).fail((err) => {
          console.log('error', err);
        });

        if (fs.existsSync(p12FilePath)) {
          const p12File = await upload(process.env.AWSBucket,
              `${clientFileName}.p12`,
              fs.readFileSync(p12FilePath),
              'application/x-pkcs12'
          )

          // save p12 to notary
          notaryDatasDoc.certfileUrl = p12File.Location;
          notaryDatasDoc.certfilename = clientFileName;
          notaryDatasDoc.certfileSource = 'automatic';
          notaryDatasDoc.certfileAddedAt = new Date();
          notaryDatasDoc.fileKey = clientFileName;
          await notaryDatasDoc.save();

          await signDocument(uploadedDocumentDoc.key,
              notaryDatasDoc.fileKey,
              sessionid,
              'Signed Certificate By Blue Notary.',
              notaryData);

          // remove p12 in ssl
          fs.unlinkSync(p12FilePath)
        } else {
          console.log('error: it could not generate p12')
        }
      }
      let paymentDone = {}
      if (lastDocument === 'true') {
        AlertingService.endSessionAlertingService(sessionid, user.id, false)
        paymentDone = await processChargesForSession(sessions, notaries, user);
      }
      res.status(200).json({
        success: true,
        paymentDone
      });
    } else {
      res.status(400).json({ error: true });
    }
  } catch (err) {
    const error = err as any;
    console.log('error', error)
    if (error.code) {
      let errorMessage = 'Your card was declined. Reason: ' + error.code
      if (error.decline_code) {
        errorMessage += ' (' + error.decline_code + ')'
      }
      sessions.failMessage = errorMessage
      sessions.paid = false
      sessions.save()
      res.status(200).json({
        success: true,
        paymentDone: 'failure'
      });
    } else {
      utils.handleError(res, error);
    }
  }
};

exports.pdfEditsVideoDocumentSave = async (req, res) => {
  const sessionid = req.params && req.params.id
  const sessions = await NewSessionModel.findOne({ _id: sessionid });
  try {
    // const file = req.file
    const user = req.user
    req = matchedData(req);
    const filepathStarting = videoSavingDir + '/SESSION_VIDEO_' + sessionid + '*'
    const filepath = videoSavingDir + '/SESSION_VIDEO_OUTPUT_' + sessionid + '.mp4'
    sessions.videoSavingProcessingStage = 'processing'
    await sessions.save();
    glob(filepathStarting, {}, async (err, files) => {
      console.log(files)
      if (!files.length) {
        sessions.videoSavingProcessingStage = 'failed'
        sessions.videoSavingProcessingError = 'No video files Found. Invalid Session'
        await sessions.save();
        return res.status(400).json({
          errors: {
            msg: 'No video files Found. Invalid Session'
          }
        })
      }
      try {
        const complexFilter = ['', '']
        for (let fileNumber = 0; fileNumber < files.length; fileNumber += 1) {
          complexFilter[0] += '[' + String(fileNumber) + ':v]'
          complexFilter[1] += '[' + String(fileNumber) + ':a]'
        }
        complexFilter[0] += 'hstack=inputs=' + String(files.length) + '[v]'
        complexFilter[1] += 'amix=inputs=' + String(files.length) + '[a]'
        // const complexFilter = [
        //   "[0:v][1:v][2:v]hstack=inputs=3[v]",
        //   "[0:a][1:a][2:a]amix=inputs=3[a]"
        // ]
        console.log(complexFilter)
        files
        .reduce((prev, curr) => prev.input(curr), ffmpeg())
        .complexFilter(complexFilter)
        .outputOptions([
          '-map [v]',
          '-map [a]'
        ])
        .output(filepath)
        .on('error', (er) => {
          console.log(`An eror occurred while merging video files: ${er.message}`);
          sessions.videoSavingProcessingStage = 'failed'
          sessions.videoSavingProcessingError = String(er.message)
          sessions.save();
          saveTheIndividualFailedStreams(sessions, files)
          res.status(400).json({ errors: {
            msg: er.message
          }});
        })
        .on('end', async () => {
          const fileContent = fs.readFileSync(filepath);
          const fileSize = fs.statSync(filepath)
          const file = await upload(process.env.AWSBucket, 'SESSION_VIDEO_OUTPUT_' + sessionid + '.mp4',
          fileContent, 'video/mp4')
          console.log(file)
          if (file) {
            // Create Document First
            const url = s3.getSignedUrl('getObject', {
                Bucket: process.env.AWSBucket,
                Key: file.Key,
                Expires: 60 * 60 * 24 * 6
            });
            console.log(url)
            const uploadedDocument = new DocumentModel({
              sessionid,
              documentCategory: 'video_recording_file',
              name: 'SESSION_VIDEO_OUTPUT_' + sessionid + '.mp4',
              url,
              type: 'video/mp4',
              size: fileSize.size,
              key: file.Key,
              bucketName: file.Bucket,
              uploadedBy: user.id,
              uploadedStage: 'meet_notary_stage'
            });
            const uploadedDocumentDoc = await uploadedDocument.save();

            sessions.videoFileDocumentId = uploadedDocumentDoc._id;
            sessions.videoSavingProcessingStage = 'completed'
            await sessions.save();
            saveTheIndividualFailedStreams(sessions, files)
            res.status(200).json({ success: true });
          } else {
            sessions.videoSavingProcessingStage = 'failed'
            sessions.videoSavingProcessingError = 'Video Upload failed'
            await sessions.save();
            saveTheIndividualFailedStreams(sessions, files)
            res.status(200).json({ error: true });
          }
          fs.unlinkSync(filepath);
          _.map(files, (tempfile) => {
            try {
              fs.unlinkSync(tempfile);
            } catch (error) {
              console.log(error)
            }
          })
        }).run()
      } catch (error) {
        console.log('error1', error)
        sessions.videoSavingProcessingStage = 'failed'
        sessions.videoSavingProcessingError = String(error)
        await sessions.save();
        saveTheIndividualFailedStreams(sessions, files)
        res.status(400).json({ errors: {
          msg: String(error)
        }});
      }
    })
  } catch (error) {
    sessions.videoSavingProcessingStage = 'failed'
    sessions.videoSavingProcessingError = String(error)
    await sessions.save();
    utils.handleError(res, error);
  }
};

exports.addWitnessDuringSession = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    const sessionid = req.sessionid
    const witnessDetails = req.witnessDetails
    const sessions = await NewSessionModel.findOne({ _id: sessionid });

    let witnessDoc;
    let witnessUser;
    const password = utils.generateRandomPassword(6);
    if (witnessDetails.id) {
      witnessDoc = await WitnessModel.findOne({_id: witnessDetails.id})
      // const password = utils.generateRandomPassword(6);
      if (!witnessDoc) {
        return res.status(400).json({
          errors: {
            msg: 'Witness Doc not found'
          }
        })
      }
      const existingUserDoc = await User.findOne({email: sessionid + '_' + witnessDoc.email})
      if (existingUserDoc) {
        return res.status(400).json({
          errors: {
            msg: 'This Witness already added to the session'
          }
        })
      }
      witnessUser = new User({
        name: witnessDoc.firstName + ' ' + witnessDoc.lastName,
        first_name: witnessDoc.firstName,
        last_name: witnessDoc.lastName,
        email: sessionid + '_' + witnessDoc.email,
        realEmail: witnessDoc.email,
        password,
        verification: uuid.v4(),
        role: 'witness',
        state: '',
        verified: true,
        temporary: true,
        witnessid: witnessDoc._id
      });
      await witnessUser.save();
    } else if (witnessDetails.witnessSelectionType === 'bn_witness_open_call') {
      sessions.sessionOpenCallForWitness = true
      sessions.sessionOpenCallForWitnessAt = new Date()
      await sessions.save()
    } else {
      console.log(sessionid + '_' + witnessDetails.email)
      const existingUserDoc = await User.findOne({email: sessionid + '_' + witnessDetails.email})
      if (existingUserDoc) {
        return res.status(400).json({
          errors: {
            msg: 'This Witness already added to the session'
          }
        })
      }
      witnessDoc = new WitnessModel({
        userid: user.id,
        usertype: user.role,
        firstName: witnessDetails.firstName,
        lastName: witnessDetails.lastName,
        email: witnessDetails.email,
        phoneNumber: witnessDetails.phoneNumber
      })
      await witnessDoc.save()
      // password = utils.generateRandomPassword(6);
      // console.log('password ', password);
      // console.log('email ', email);
      // create new customer with email and generated password
      witnessUser = new User({
        name: witnessDetails.firstName + ' ' + witnessDetails.lastName,
        first_name: witnessDetails.firstName,
        last_name: witnessDetails.lastName,
        email: sessionid + '_' + witnessDetails.email,
        realEmail: witnessDetails.email,
        password,
        verification: uuid.v4(),
        role: 'witness',
        state: '',
        verified: true,
        temporary: true,
        witnessid: witnessDoc._id
      });
      await witnessUser.save();
    }
    if (witnessDetails.witnessSelectionType !== 'bn_witness_open_call') {
      const sessionWitnessQuery = {
        sessionid,
        witnessid: witnessDoc._id
      }
      let originalSessionWitnessDoc = await SessionWitness.findOne(sessionWitnessQuery)
      if (!originalSessionWitnessDoc) {
        originalSessionWitnessDoc = new SessionWitness({
          sessionid,
          witnessid: witnessDoc._id
        })
        await originalSessionWitnessDoc.save()
      }
      emailer.sendEmailToWitnessWhenInvitedToSession(witnessUser, password, sessions.meetingdatetimeobj, sessionid);
    }
    let allSessionWitnessDocs = await SessionWitness.find({
      sessionid,
      deleted: {$ne: true}
    })
    const allWitnessIds = _.map(allSessionWitnessDocs, 'witnessid')
    const allWitnessDocs = await WitnessModel.find({
      _id: {$in: allWitnessIds},
      deleted: {$ne: true}
    })
    const witnessDocsKeyed = _.keyBy(allWitnessDocs, '_id')
    allSessionWitnessDocs = _.map(allSessionWitnessDocs, (localSessionWitnessDoc) => {
      localSessionWitnessDoc = JSON.parse(JSON.stringify(localSessionWitnessDoc))
      localSessionWitnessDoc.witnessDoc = witnessDocsKeyed[String(localSessionWitnessDoc.witnessid)]
      return localSessionWitnessDoc
    })
    res.status(200).json({
      success: true,
      allSessionWitnessDocs
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.getAllWitnessDetails = async (req, res) => {
  try {
    const user = req.user

    const allWitnessDocs = await WitnessModel.find({
      userid: user.id,
      deleted: {$ne: true}
    })
    res.status(200).json({
      allWitnessDocs
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.joinSessionAsWitness = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);
    console.log('req', req)
    const sessionid = req.sessionid
    console.log('sessionid', sessionid)
    const sessions = await NewSessionModel.findOne({ _id: sessionid });
    console.log('sessions', sessions)
    // Use below variable for future witnesses
    const joinedAsBNWitness = true;

    if (joinedAsBNWitness) {

      // const sessionWitnessQuery = {
      //   sessionid,
      //   userid: user._id
      // }
      let sessionWitnessQuery;
      if (user.role === 'witness' && user.witnessid) {
        sessionWitnessQuery = {
          $or: [
            {
              sessionid,
              userid: user._id
            },
            {
              sessionid,
              witnessid: user.witnessid
            }
          ]
        }
      } else {
        sessionWitnessQuery = {
          $or: [
            {
              sessionid,
              userid: user._id
            }
          ]
        }
      }
      const userAlreadyWitnessInCurrentSession = await SessionWitness.findOne(sessionWitnessQuery)
      if (!userAlreadyWitnessInCurrentSession && !sessions.sessionOpenCallForWitness) {
        return res.status(400).json({
          failure: true,
          errors: {
            msg: 'Session already joined by witness'
          }
        })
      }

      if (!userAlreadyWitnessInCurrentSession) {
        const newSessionWitnessDoc = new SessionWitness({
          sessionid,
          userid: user._id
        })
        await newSessionWitnessDoc.save()
      }

      // Uncomment below when ready
      sessions.sessionOpenCallForWitness = null
      sessions.sessionOpenCallForWitnessAt = null
      await sessions.save()
    }
    return res.status(200).json({
      success: true
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.getAllSessionWitnesses = async (req, res) => {
  try {
    const sessionid = req.params && req.params.id
    let userAlreadyWitnessInCurrentSession = await SessionWitness.find({sessionid})
    const witnessUserDocs = await User.find({witnessid: {$in: _.map(userAlreadyWitnessInCurrentSession, 'witnessid')}})
    const witnessDocs = await WitnessModel.find({_id: _.map(userAlreadyWitnessInCurrentSession, 'witnessid')})
    const userDocs = await User.find({_id: _.map(userAlreadyWitnessInCurrentSession, 'userid')})
    const witnessUserDocsMap = {}
    _.map(witnessUserDocs, (witnessUserDoc) => {
      witnessUserDocsMap[witnessUserDoc.witnessid] = witnessUserDoc._id
    })
    const witnessDocMap = {}
    _.map(witnessDocs, (witnessDoc) => {
      witnessDocMap[witnessDoc._id] = witnessDoc
    })
    const userDocMap = {}
    _.map(userDocs, (userDoc) => {
      userDocMap[userDoc._id] = userDoc
    })
    userAlreadyWitnessInCurrentSession = JSON.parse(JSON.stringify(userAlreadyWitnessInCurrentSession))
    userAlreadyWitnessInCurrentSession = _.map(userAlreadyWitnessInCurrentSession, (sessionWitnessDoc) => {
      if (sessionWitnessDoc.witnessid && witnessUserDocsMap[sessionWitnessDoc.witnessid]) {
        sessionWitnessDoc.userid = witnessUserDocsMap[sessionWitnessDoc.witnessid]
      }
      if (sessionWitnessDoc.witnessid && witnessDocMap[String(sessionWitnessDoc.witnessid)]) {
        sessionWitnessDoc.witnessdoc = witnessDocMap[String(sessionWitnessDoc.witnessid)]
      }
      if (sessionWitnessDoc.userid && userDocMap[String(sessionWitnessDoc.userid)]) {
        sessionWitnessDoc.userdoc = userDocMap[String(sessionWitnessDoc.userid)]
      }
      return sessionWitnessDoc
    })
    return res.status(200).json({
      sessionWitnesses: userAlreadyWitnessInCurrentSession
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.removeSessionWitness = async (req, res) => {
  try {
    // const user = req.user
    req = matchedData(req);
    const sessionid = req.sessionid
    const sessionwitnessid = req.sessionwitnessid
    console.log(sessionid, sessionwitnessid)
    const sessionWitnessDoc = await SessionWitness.findOne({
      _id: sessionwitnessid,
      sessionid
    })
    if (!sessionWitnessDoc) {
      return res.status(400).json({
        errors: {
          msg: 'Witness Not Found'
        }
      })
    }
    await SessionWitness.remove({
      _id: sessionwitnessid,
      sessionid
    })
    console.log('sessionWitnessDoc', sessionWitnessDoc)
    return res.status(200).json({
      success: true
    })
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const user = req.user
    console.log('user:', user)
    req = matchedData(req);
    console.log('req:', req)

    const notaries = await IdentityModel.findOne({ sessionid: req.sessionId, userId: user._id })
    if (!notaries) {
      return res.status(200).json({ message: 'No session available, please check and try again.' });
    }
    let customer;
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    customer = await stripeToUse.customers.create({
      email: notaries.email,
      source: req.data.id
    });
    notaries.stripeCustomerID = customer.id;
    notaries.stripeBrand = req.data.card.brand;
    notaries.last4 = req.data.card.last4;
    notaries.exp_month = req.data.card.exp_month;
    notaries.exp_year = req.data.card.exp_year;
    await notaries.save();

  // update session stage
    const session = await NewSessionModel.findOne({_id: req.sessionId});
    console.log(session)
    if (session.currentStage === 'payment_info_stage') {
      if (session.notorizationTiming === 'notarize_later' && !session.notaryUserId) {
        session.status = 'ready to pick'; // Ready to Notary to be picked
      } else {
        session.status = 'ready to sign'; // Ready to meet Notary
      }
      session.currentStage = 'meet_notary_stage';
      session.stagesHistory.push({
        stageName: 'Meet Notary stage',
        stageDate: new Date()
      });
      session.save();
    }

  // update document stage
    const document = await DocumentModel.findOne({sessionid: session._id});
    if (document.uploadedStage === 'payment_info_stage') {
    document.uploadedStage = 'meet_notary_stage';
    document.save();
  }

    res.status(200).json(notaries);
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.stripeSessionStatus = async (req, res) => {
  try {
    const user = req.user;
    const notarydm = await NotaryDataModel.findOne({ userId: user._id });
    if (notarydm.upgradeStripeSessionId) {
      let stripeToUse;
      if (user.testingacc) {
        stripeToUse = stripeTest
      } else {
        stripeToUse = stripe
      }
      const session = await stripeToUse.checkout.sessions.retrieve(notarydm.upgradeStripeSessionId);
      if (session.payment_status === 'paid') {
        const userModel = await User.findOne({email: user.email});
        userModel.memberType = 'pro';
        userModel.save();
        notarydm.subscriptionExpiresOn = session.expires_at;
        notarydm.save();
      }
      res.status(200).json(session);
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.saveNotaryCustomCharges = async (req, res) => {
  try {
    const user = req.user;
    const userModel = await User.findOne({email: user.email});
    console.log(req.body)
    if (req.body && req.body.notaryCustomCharges) {
      userModel.notaryCustomCharges = req.body.notaryCustomCharges
      userModel.save();
    }
    res.status(200).json({
      success: true
    });
  } catch (error) {
    console.log('error', error)
    utils.handleError(res, error);
  }
};
exports.stripeCheckoutSession = async (req, res) => {
  try {
    const user = req.user;
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    const session = await stripeToUse.checkout.sessions.create({
      line_items: [{
        price: process.env.NOTARY_SUBSCRIPTION_PRICE_ID,
        quantity: 1
      }],
      customer_email: user.email,
      mode: 'subscription',
      success_url: process.env.FRONT_URL + '/notary/upgrade/success',
      cancel_url: process.env.FRONT_URL + '/notary'
    });
    notarydm.upgradeStripeSessionId = session.id;
    notarydm.save();
    res.status(200).json(session);
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.repaymentForSession = async (req, res) => {
  const user = req.user
  console.log('user:', user)
  req = matchedData(req);
  console.log('req:', req)
  const sessions = await NewSessionModel.findOne({ _id: req.sessionId });
  try {
    console.log({
      sessionid: String(req.sessionId), userId: user._id
    })
    const notaries = await IdentityModel.findOne({ sessionid: String(req.sessionId), userId: user._id })
    if (!notaries) {
      return res.status(200).json({ message: 'No session available, please check and try again.' });
    }
    let customer;
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    customer = await stripeToUse.customers.create({
      email: notaries.email,
      source: req.data.id
    });
    notaries.stripeCustomerID = customer.id;
    notaries.stripeBrand = req.data.card.brand;
    notaries.last4 = req.data.card.last4;
    notaries.exp_month = req.data.card.exp_month;
    notaries.exp_year = req.data.card.exp_year;
    await notaries.save();
    const paymentDone = await processChargesForSession(sessions, notaries, user)
    console.log(paymentDone)
    if (paymentDone) {
      sessions.paid = true
      await sessions.save()
    }
    res.status(200).json({
      paymentDone
    });
  } catch (err) {
    const error = err as any;
    let errorMessage = 'Your card was declined. Reason: ' + error.code
    if (error.decline_code) {
      errorMessage += ' (' + error.decline_code + ')'
    }
    sessions.failMessage = errorMessage
    sessions.save()
    res.status(402).json({
      errors: {
        msg: errorMessage
      }
    });
    // utils.handleError(res, error);
  }
};

exports.saveSignatures = async (req, res) => {
  const user = req.user
  req = matchedData(req);
  const signaturedata = req.signaturedata;
  const newSignature = new SignaturesDataModel({
    signaturedata,
    user: user._id
  })
  await newSignature.save()
  res.status(200).json({ message: 'Your signature saved successfully.' });
}

exports.getSignatures = async (req, res) => {
  const user = req.user
  req = matchedData(req);
  const signatures = await SignaturesDataModel.find({
    user: user._id,
    deleted: {$ne: true}
  }).sort({createdAt: -1})
  res.status(200).json({ signatures });
}

exports.deleteSignature = async (req, res) => {
  const user = req.user
  req = matchedData(req);
  const signatureId = req.signatureId
  console.log(user)
  console.log(signatureId)
  const signatureDoc = await SignaturesDataModel.findOne({
    _id: signatureId,
    user: user._id,
    deleted: {$ne: true}
  })
  if (!signatureDoc) {
    return res.status(200).json({
      errors: {
        msg: 'Signature Doc Not Found'
      }
    });
  }
  signatureDoc.deleted = true
  signatureDoc.deletedAt = new Date()
  await signatureDoc.save();
  res.status(200).json({
    success: true
  });
}

exports.saveSignatureImageFile = async (req, res) => {
  const user = req.user;
  const file = req.file;
  console.log('file', file)
  req = matchedData(req);
  const fileLocation = file.location;
  const backPhotoIdUrl = fileLocation.replace(/^https:\/\//i, 'http://');
  http.get(backPhotoIdUrl, (resp) => {
    resp.setEncoding('base64');
    let fileData = 'data:image/png;base64,';
    resp.on('data', (data) => {
      fileData += data;
    });
    resp.on('end', async () => {
      const newSignature = new SignaturesDataModel({
        signaureFileName: file.originalname,
        signaureFileUrl: file.location,
        signaureFileType: file.mimetype,
        signaureFileSize: file.size,
        signaureFileKey: file.key,
        signaureFileBucket: file.bucket,
        signaturedata: fileData,
        user: user._id
      })
      await newSignature.save()
      res.status(200).json({ message: 'Signature uploaded successfully.', file: file.location,
        signatureDoc: newSignature });
    });
  }).on('error', (e) => {
    res.status(400).json({
      error: e.message
    })
  });
},

// Notary - invite signer
exports.notaryInviteSigner = async (req, res) => {
  try {
    const files = req.files;
    console.log('uploadFile 2:', files)
    // console.log('uploadFile 2:', req.files)
    // console.log('uploadFile 2:', req.file)
    // const user = req.user
    req = matchedData(req);
    const email = req.email;
    const name = req.name;
    const notaryId = req.notary_user_id;
    const meetingDate = req.meetingdate;
    const meetingTimeZone = req.meetingTimeZone;
    const currentTimeZone = req.currentTimeZone;
    const sessionType = req.sessionType;
    const templateId = req.template;
    let multiSignerList = req.multiSignerList;
    if (multiSignerList) {
      try {
        multiSignerList = JSON.parse(multiSignerList)
      } catch (error) {
        console.log(error)
      }
    }
    console.log('name:', name);
    console.log('email:', email);
    console.log('notaryId:', notaryId);
    console.log('meetingDate:', meetingDate);
    console.log('meetingTimeZone:', meetingTimeZone);
    console.log('template:', templateId);
    console.log('multiSignerList:', multiSignerList);
    console.log('sessionType:', sessionType);
    // check if email exists
    let customer = await User.findOne({email});
    const notaryuser = await User.findOne({ _id: notaryId });
    let password = '';
    let dontSendTempPassword = true;
    if (!customer) {
      // generate random password
      password = utils.generateRandomPassword(6);
      dontSendTempPassword = false;
      console.log('password ', password);
      console.log('email ', email);
      // create new customer with email and generated password
      customer = new User({
        name,
        email,
        password,
        verification: uuid.v4(),
        role: 'customer',
        commissionNumber: '',
        state: '',
        verified: true
      });
      await customer.save();
    } else {
      if (customer.name === '') {
        customer.name = name;
        await customer.save();
      }
      password = customer.password
    }
    let meetingDateTimeObj;
    meetingDateTimeObj = moment(meetingDate, 'YYYY-MM-DD hh:mm A');
    if (meetingTimeZone) {
      let currentTimeZoneOffset = parseFloat(String((new Date()).getTimezoneOffset() / 60))
      if (currentTimeZone) {
        currentTimeZoneOffset = parseFloat(String(currentTimeZone))
      }
      const currentMeetingTimeZone = parseFloat(meetingTimeZone)
      const finalOffset = (currentMeetingTimeZone - currentTimeZoneOffset) * 60
      meetingDateTimeObj = moment(meetingDate, 'YYYY-MM-DD hh:mm A').utcOffset(finalOffset, true)
    } else {
      meetingDateTimeObj = moment(meetingDate, 'YYYY-MM-DD hh:mm A')
    }
    const sessionDoc = {
      sessionid: uuidV4(),
      userId: customer._id,
      notaryUserId: notaryId,
      currentStage: 'initial_stage',
      sessionCode: (Math.random() + 1).toString(36).substring(7).toUpperCase(),
      status: 'unsigned',
      // finalDocumentId: '',
      // finalDocumentWithPdf: "",
      // x509Certificate: '',sending i just creage,
      meetingdate: meetingDate,
      meetingdatetimeobj: meetingDateTimeObj,
      meetingTimeZone,
      stagesHistory: [{
          stageName: 'Notary Invite Signer Session Created',
          stageDate: new Date()
      }],
      multiSignerList: null,
      sessionType
    }
    if (multiSignerList && _.isArray(multiSignerList) && multiSignerList.length) {
      sessionDoc.multiSignerList = multiSignerList
    }
    // create new session
    const session =  new NewSessionModel(sessionDoc);
    await session.save();
    if (templateId && templateId !== 'null') {
      const template = await DocumentTemplate.findOne({ _id: templateId });
      const uploadedDocument = new DocumentModel({
        sessionid: session._id,
        documentCategory: 'initial_document',
        name: template.key,
        url: template.documentUrl,
        type: 'application/pdf',
        key: template.key,
        bucketName: process.env.AWSBucket,
        uploadedBy: notaryId,
        uploadedStage: 'initial_stage'
      });
      await uploadedDocument.save();

      session.originalDocumentId = uploadedDocument._id;
      session.originalDocumentIds = [uploadedDocument._id];
      await session.save();
      const pdfDroppedElementDataDoc = await PDFDroppedElementsModel.findOne({
        templateid: templateId
      })
      if (pdfDroppedElementDataDoc) {
        const droppedElements = pdfDroppedElementDataDoc.droppedElements || []
        if (droppedElements.length) {
          const newPDFDroppedElementDataDoc = new PDFDroppedElementsModel({
            sessionid: session._id,
            droppedElements
          })
          await newPDFDroppedElementDataDoc.save()
        }
      }
    } else {
      if (files) {
        const allDocumentIdsUploaded = []
        // files
        await Promise.all(_.map(files, async (file) => {
          const uploadedDocument = new DocumentModel({
            sessionid: session._id,
            documentCategory: 'initial_document',
            name: file.originalname,
            url: file.location,
            type: file.mimetype,
            size: file.size,
            key: file.key,
            bucketName: file.bucket,
            uploadedBy: notaryId,
            uploadedStage: 'initial_stage'
          });
          await uploadedDocument.save();
          allDocumentIdsUploaded.push(uploadedDocument._id)
        }));

        session.originalDocumentId = allDocumentIdsUploaded && allDocumentIdsUploaded[0];
        session.originalDocumentIds = allDocumentIdsUploaded;
        await session.save();
      }
    }
    // send email to user
    emailer.sendNotarySignerEmail(
      customer, notaryuser, password, meetingDate, session._id, meetingTimeZone, dontSendTempPassword
    );
    res.status(200).json({
      session,
      email: customer.email
    });
  } catch (error) {
    utils.handleError(res, error);
  }

};

// Fetch sessions
exports.fetchNotarySessions = async (req, res) => {
  const user = req.user;
  req = matchedData(req);
  try {
    // check if email exists

    const sessionWitnessIds = await SessionWitness.distinct('sessionid', {
      userid: user.id
    })
    console.log('sessionWitnessIds', sessionWitnessIds)
    const sessionIds = req.session_ids || false;
    let sessionFindQuery
    if (req.journal) {
      sessionFindQuery = {
        $or: [
          {
            notaryUserId: req.notary_user_id
          },
          {
            sessionActive: true,
            _id: {$in: sessionWitnessIds}
          }
        ]
      }
    } else {
      const testingAccUserDocs = await User.find({
        testingacc: true
      })
      const testingAccUserIds = _.map(testingAccUserDocs, '_id');
      let userDocQuery
      if (user.testingacc) {
        userDocQuery = {$in: testingAccUserIds}
      } else {
        userDocQuery = {$nin: testingAccUserIds}
      }
      sessionFindQuery = {
        deleted: {$ne: true},
        userId: userDocQuery,
        $or: [
          {
            notaryUserId: req.notary_user_id
          },
          {
            notaryUserId: {$exists: false},
            sessionActive: true
          },
          {
            notaryUserId: {$exists: false},
            sessionOpenCallForTaking: true
          },
          {
            sessionOpenCallForWitness: true
          },
          {
            sessionActive: true,
            _id: {$in: sessionWitnessIds}
          }
        ]
      }
    }
    console.log('sessionIds', sessionIds)
    console.log('req.body', req.body)
    console.log('sessionFindQuery', sessionFindQuery)
    // if (sessionIds && sessionIds.length) {
    //   sessionFindQuery._id = {
    //     $in: _.map(sessionIds, (id) => new mongoose.Types.ObjectId(id))
    //   }
    // }
    console.log(sessionFindQuery)
    const sessionWitnessIdsString = _.map(sessionWitnessIds, (tempId) => {
      return String(tempId)
    })
    const sessions = await NewSessionModel.find(sessionFindQuery).sort({createdAt: -1});
    const sessionData = [];
    const allAdditionalSignerEmails = []
    let sessionIdentityDocsKeyed = {}
    const allSessionIds = _.map(sessions, '_id')
    for (const item of sessions) {
      if (item.multiSignerList) {
        _.map(item.multiSignerList, (multiSignerDoc) => {
          if (multiSignerDoc.email) {
            allAdditionalSignerEmails.push(multiSignerDoc.email)
          }
        })
      }
    }
    let additionalSignerEmailUserDocMap = {}
    if (allAdditionalSignerEmails.length) {
      const allAdditionalSignerUserDocs = await User.find({
        email: {$in: allAdditionalSignerEmails}
      })
      additionalSignerEmailUserDocMap = _.keyBy(allAdditionalSignerUserDocs, 'email')
    }
    const sessionIdentityDocs = await IdentityModel.find({
      sessionid: {$in: allSessionIds}
    })
    sessionIdentityDocsKeyed = _.groupBy(sessionIdentityDocs, 'sessionid')
    for (const session of sessions) {
      let finalDocument;
      const customer = await User.findOne({_id: session.userId});
      const document = await DocumentModel.find({ sessionid: session._id, documentCategory: 'initial_document' });
      const identityData = await IdentityModel.findOne({ sessionid: session._id });
      // let finalDocumentId = session.finalDocumentId;
      let videoDataId = session.videoFileDocumentId;
      if (session.paid === false) {
        // finalDocumentId = ''
        videoDataId = ''
      }
      if (session.status === 'complete') {
        if (session.paid !== false) {
          finalDocument = await DocumentModel.find({ sessionid: session._id,
            documentCategory: 'final_document_with_dc' });
        }
      } else {
        finalDocument = false;
      }
      let videoData;
      if (session.status === 'complete' && videoDataId) {
        videoData = await DocumentModel.findOne({ _id: videoDataId });
      } else {
        videoData = false
      }
      if (session.sessionActive && session.sessionActiveFrom) {
        const diff = new Date().valueOf() - session.sessionActiveFrom.valueOf()
        const diffMinutes = diff / (60 * 1000)
        if (diffMinutes > SESSION_TIMEOUT_IN_MINUTES) {
          console.log('diffMinutes inside', diffMinutes)
          session.sessionActive = null
          session.sessionActiveFrom = null
          // delete session.sessionActive
          // delete session.sessionActiveFrom
          session.save()
        }
        console.log(session)
      }
      let joinedAsWitness = false
      if (_.includes(sessionWitnessIdsString, String(session._id))) {
        joinedAsWitness = true
      }
      const sessionJoinedUserLog = await SessionUserLogs.findOne({
        sessionid: session._id,
        actionType : 'join_session'
      })
      let sessionStartedTime = false;
      if (sessionJoinedUserLog) {
        sessionStartedTime = sessionJoinedUserLog.createdAt
      }
      const additionalSignerIdentyDocs = []
      const allNotaryIdentities = sessionIdentityDocsKeyed[session._id] || []
      _.map(session.multiSignerList, (multiSignerDoc) => {
        const userDoc = additionalSignerEmailUserDocMap[multiSignerDoc.email]
        let identityDocFound = false
        if (userDoc) {
          _.map(allNotaryIdentities, (tempIdentityDoc) => {
            if (String(tempIdentityDoc.userId) === String(userDoc._id)) {
              additionalSignerIdentyDocs.push(tempIdentityDoc)
              identityDocFound = true
            }
          })
        }
        if (!identityDocFound) {
          additionalSignerIdentyDocs.push(multiSignerDoc)
        }
      })
      sessionData.push({
        session,
        signer: (customer && customer.name) ? customer.name : (customer && customer.email ? customer.email : ''),
        inviteLink: `${process.env.FRONT_URL}/business/prepare_doc/${session._id}`,
        signerEmail: (customer) ? customer.email : '',
        documentName: (document && document[0]) ? document[0].name : 'N/A',
        documentUrl: (document && document[0]) ? document[0].url : '#',
        documents: document,
        finalDocument,
        identityData,
        videoData,
        joinedAsWitness,
        sessionStartedTime,
        additionalSignerIdentyDocs
      });
    }
    res.status(200).json({sessionData});
  } catch (error) {
    utils.handleError(res, error);
  }
};

// Cron - check expired Documents
exports.checkExpiredDocument = async (req, res) => {
  console.log('check expired document');
  try {
    const today = new Date();
    const yesterdayDate = today.setDate(today.getDate() - 1);
    const sessions = await NewSessionModel.find({
      status: 'unsigned',
      createdAt: {
          $lte: new Date(yesterdayDate)
      }
    });
    console.log('yesterday', yesterdayDate);
    console.log('sessions', sessions.length);
    if (sessions.length) {
      for (const session of sessions) {
        // check if is there any document, remove it
        const document = await DocumentModel.findOne({ sessionid: session._id });
        if (document) {
          await document.remove();
        }
        // revert session stage to initial stage
        session.currentStage = 'initial_stage';
        // set session to expired
        session.status = 'expired';
        // add stage history.
        session.stagesHistory.push({
          stageName: 'Expired Status set by Cron after 24hours of session create',
          stageDate: new Date()
        });

        // save session
        await session.save();
      }
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

exports.checkExpiredCommissionLetter = async (req, res) => {
  console.log('check expired commission');
  try {
    const notarydata = await NotaryDataModel.find({
      commissionExpiresOn: {
          $lt: new Date().getTime() / 1000 - 3600
      }
    });
    if (notarydata.length) {
      for (const data of notarydata) {
        const notaryUser = await User.findOne({
          _id: data.userId
        });
        if (notaryUser.approve === 'active') {
          notaryUser.approve = 'inactive';
          notaryUser.isCommissionExpired = true;
          await notaryUser.save();
          emailer.sendCommissionExpiredEmailMessage(notaryUser);
        }
      }
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Cron - check expired Sessions
exports.checkExpiredSession = async () => {
  console.log('check expired session');
  try {
    const today = new Date();
    const lastSevenDaysDate = today.setDate(today.getDate() - 7);
    const sessions = await NewSessionModel.find({
      status: {
        $nin: ['complete', 'expired']
      },
      createdAt: {
          $lte: new Date(lastSevenDaysDate)
      }
    });
    console.log('lastSevenDaysDate', lastSevenDaysDate);
    console.log('sessions', sessions.length);
    if (sessions) {
      for (const session of sessions) {
        // check if is there any document, remove it
        const document = await DocumentModel.findOne({ sessionid: session._id });
        if (document) {
          await document.remove();
        }
        // revert session stage to initial stage
        session.currentStage = 'initial_stage';
        // set session to expired
        session.status = 'expired';
        // add stage history.
        session.stagesHistory.push({
          stageName: 'Expired Status set by Cron after 7 days of session create',
          stageDate: new Date()
        });

        // save session
        await session.save();
      }
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Cron - reminder users for upcoming sessions before 1 hour -- we run this script
// every 10 mins to check if any session in next 50-60 minutes range
exports.checkForSessionsInNextHourAndSendReminderEmail = async () => {
  console.log('checking sessions in next 50-60 ');
  try {
    const next50Minutes = moment().add(50, 'minutes')
    const next60Minutes = moment().add(60, 'minutes')
    console.log(next50Minutes, next60Minutes)
    const sessions = await NewSessionModel.find({
      status: {
        $nin: ['complete', 'expired']
      },
      meetingdatetimeobj: {
        $gt: next50Minutes,
        $lte: next60Minutes
      }
    });
    // console.log('lastSevenDaysDate', lastSevenDaysDate);
    console.log('sessions', sessions.length);
    _.map(sessions, async (sessionDoc) => {
      console.log(sessionDoc)
      const sessionUserId = sessionDoc.userId;
      const sessionNotaryId = sessionDoc.notaryUserId;
      const allUserIds = [sessionUserId]
      if (sessionNotaryId) {
        allUserIds.push(sessionNotaryId)
      }
      const userDocs = await User.find({
        _id: {$in: allUserIds}
      })
      const shortSessionID = (sessionDoc._id).toString().substr((sessionDoc._id).toString().length - 5).toUpperCase();
      _.map(userDocs, (userDoc) => {
        emailer.sendSessionReminderEmails(userDoc, sessionDoc.meetingdatetimeobj, shortSessionID)
      })
    })
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

exports.uploadCustomerPhotoID = async (req, res) => {
  try {
    const user = req.user;
    let message = '';
    const file = req.file
    console.log(file);
    req = matchedData(req);
    if (file) {
      console.log(file);
      const identityModel = await IdentityModel.exists({ sessionid: req.sessionId, userId: user._id });
      let additionalSigner = false;
      if (req.additionalSigner) {
        additionalSigner = true
      }
      console.log('identityModel', identityModel)
      if (!identityModel) {
        if (req.documentType === 'front') {
          const newIdentityModel = new IdentityModel({
            sessionid: req.sessionId,
            frontPhotoIdName: file.originalname,
            frontPhotoIdUrl: file.location,
            frontPhotoIdType: file.mimetype,
            frontPhotoIdSize: file.size,
            frontPhotoIdKey: file.key,
            frontPhotoIdBucketName: file.bucket,
            additionalSigner
          });
          message = 'Front photo ID uploaded successfully.';
          await newIdentityModel.save();
        } else {
          const newIdentityModel = new IdentityModel({
            sessionid: req.sessionId,
            backPhotoIdName: file.originalname,
            backPhotoIdUrl: file.location,
            backPhotoIdType: file.mimetype,
            backPhotoIdSize: file.size,
            backPhotoIdKey: file.key,
            backPhotoIdBucketName: file.bucket,
            additionalSigner
          });
          const backPhotoIdValidationPassed = await checkBackPhotoId(file.key, req.sessionId, file.originalname);
          message = 'Back photo ID uploaded successfully.';
          console.log(backPhotoIdValidationPassed)
          if (!backPhotoIdValidationPassed) {
            message = 'Back Image Validation Failed. Please use clearer image and reupload'
          } else {
            await newIdentityModel.save();
          }
        }
        res.status(200).json({ message, type: req.documentType });
      } else {
        const identityData = await IdentityModel.findOne({ sessionid: req.sessionId, userId: user._id });
        if (req.documentType === 'front') {
          identityData.frontPhotoIdUrl = file.location;
          identityData.frontPhotoIdKey = file.key;
          identityData.frontPhotoIdName = file.originalname;
          identityData.frontPhotoIdType = file.mimetype
          identityData.frontPhotoIdSize = file.size
          identityData.frontPhotoIdBucketName = file.bucket
          message = 'Front photo ID updated successfully.';
          await identityData.save();
        } else {
          identityData.backPhotoIdUrl = file.location;
          identityData.backPhotoIdKey = file.key;
          identityData.backPhotoIdName = file.originalname;
          identityData.backPhotoIdType = file.mimetype
          identityData.backPhotoIdSize = file.size
          identityData.backPhotoIdBucketName = file.bucket
          const backPhotoIdValidationPassed = await checkBackPhotoId(file.key, req.sessionId, file.originalname);
          console.log(backPhotoIdValidationPassed)
          message = 'Back photo ID updated successfully.';
          if (!backPhotoIdValidationPassed) {
            message = 'Back Image Validation Failed. Please use clearer image and reupload'
          } else {
            await identityData.save();
          }
        }
        res.status(200).json({ message });
      }
    } // if file check
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.expireSessionDocuments = async (req, res) => {
  try {
    console.log('in cron to expire session documents');
    // after 24hrs, if no update, remove document and set the session status to "expired"
    await controller.checkExpiredDocument();
    // after 7days, status is not completed  remove document and set the session status to "expired"
    await controller.checkExpiredSession();
    res.status(200).json({ status: true });
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.setSessionStageOrStatus = async (req, res) => {
  const sessionid = req.params && req.params.id
  if (!sessionid) {
    res.status(400).json({
      error: 'Session id not found'
    })
  }
  const user = req.user;
  const type = req.query.type;
  const value = req.query.value;
  const additionalSigner = req.query.additionalSigner;

  try {
    const session = await NewSessionModel.findOne({
      _id: sessionid
    });
    if (session && type && value) {
      if (additionalSigner) {
        if (type === 'stage') {
          const identityData = await IdentityModel.findOne({ sessionid, userId: user._id });
          if (identityData) {
            identityData.additionalSignerNextStage = value;
          }
          await identityData.save();
        }
      } else {
        if (type === 'stage') {
          session.currentStage = value;
        }

        if (type === 'status') {
          session.status = value;
        }

        session.stagesHistory.push({
          stageName: `${type} - ${value}`,
          stageDate: new Date()
        });

        await session.save();
      }
      res.status(200).json({status: true});
    }
    res.status(200).json({status: false});
  } catch (error) {
    utils.handleError(res, error);
  }
}

exports.isValidSession = async (req, res) =>  {
  const sessionid = req.params && req.params.id
  if (!sessionid) {
    return res.status(200).json({
      status: false
    });
  }

  try {
    const session = await NewSessionModel.findOne({
      _id: sessionid
    });
    if (session) {
      if (session.status === 'expired' ||
        session.status === 'complete' ||
        session.currentStage === 'identity_check_stage_fail' ||
        session.currentStage === 'kba_check_stage_fail'  ||
        session.currentStage === 'photoid_check_stage_fail') {
        return res.status(200).json({status: false, session});
      }
      return res.status(200).json({status: true, session});
    }
    return res.status(200).json({status: false});
  } catch (error) {
    return utils.handleError(res, error);
  }
}

async function getObject (bucket, objectKey) {
  try {
    const params = {
      Bucket: bucket,
      Key: objectKey
    }
    console.log(params)
    return await s3.getObject(params).promise();
  } catch (e) {
    const err = e as any;
    throw new Error(`Could not retrieve file from S3: ${err.message}`)
  }
}

async function upload (bucket, objectKey, buf, contentType) {
  try {
    const params = {
      Bucket: bucket,
      Key: objectKey,
      Body: buf,
      ACL: 'public-read',
      ContentEncoding: 'base64',
      ContentType: contentType
    };

    return await s3.upload(params).promise();
  } catch (e) {
    const err = e as any;
    throw new Error(`Could not upload file from S3: ${err.message}`)
  }
}

const signDocument = async (pdfKey, p12Key, sessionid, reason,
                            {dcPassword, contactInfo, name, location, notaryUserId}) => {
  const pdf = await getObject(process.env.AWSBucket, pdfKey);
  let objectKeyStr = p12Key;
  if (!p12Key.includes('.p12') && !p12Key.includes('.pfx')) {
    objectKeyStr = p12Key + '.p12'
  }
  console.log('objectKeyStr while signing', objectKeyStr)
  const DCBuffer = await getObject(process.env.AWSBucket, objectKeyStr);
  const objectKey = `${sessionid}_${Math.floor(Math.random() * 999)}_signed_pdf.pdf`
  const signatureLength = DCBuffer.Body.toString().length
  let inputBuffer;
  try {
    inputBuffer = plainAddPlaceholder({
      pdfBuffer: pdf.Body,
      reason,
      contactInfo,
      name,
      location,
      signatureLength
    });
  } catch (error) {
    console.log(error)

    const inputFile = './tmp/' + sessionid + '_input.pdf'
    const outputFile = './tmp/' + sessionid + '_output.pdf'
    await fs.createWriteStream(inputFile).write(pdf.Body);

    const { stdout, stderr } = await exec('gs -o ' + outputFile +
      ' -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress ' + inputFile);

    console.log('stdout:', stdout);
    console.log('stderr:', stderr);

    const content = fs.readFileSync(outputFile);
    inputBuffer = plainAddPlaceholder({
      pdfBuffer: content,
      reason,
      contactInfo,
      name,
      location,
      signatureLength
    });
  }
  console.log('ready to sign')
  const signedPdf = signer.sign(inputBuffer, DCBuffer.Body, {passphrase: dcPassword || 'bnDCpwd21'})
  const signedFile = await upload(process.env.AWSBucket, objectKey, signedPdf, 'application/pdf')
  const uploadedDocument = new DocumentModel({
    sessionid,
    documentCategory: 'final_document_with_dc',
    name: objectKey,
    url: signedFile.Location,
    type: 'application/pdf',
    size: signedPdf.length,
    key: objectKey,
    bucketName: signedFile.Bucket,
    uploadedBy: notaryUserId,
    uploadedStage: 'document_with_dc'
  });
  console.log('uploadedDocument', uploadedDocument)
  await uploadedDocument.save();
  return uploadedDocument;
}

const processChargesForSession = async (sessions, notaries, user) =>  {
  let paymentDone = 'failure';
  if (!sessions) {
    return paymentDone
  }
  console.log('sessions', sessions)

  // const { costOfNotarization } = sessions;
  console.log('costOfNotarization', sessions.costOfNotarization)

  const notaryUserDoc = await User.findOne({
    _id: sessions.notaryUserId
  })

  // Determining which pricing strategy to use
  let stateToUse = 'Others'
  if (notaryUserDoc && notaryUserDoc.state) {
    stateToUse = notaryUserDoc.state
  }
  let pricingDoc = PricingJson.pricing[stateToUse]
  let statePricingUsed = true;
  if (stateToUse === 'Others') {
    statePricingUsed = false;
  }
  if (!pricingDoc) {
    statePricingUsed = false;
    pricingDoc = PricingJson.pricing.Others
  }
  console.log('pricingDoc', pricingDoc)

  let notaryFee = '25.00';
  // if (pricingDoc && pricingDoc.notaryFee) {
  //   notaryFee = pricingDoc.notaryFee;
  // }
  // For Loan Signings, we pay 125$ flat to notary
  if (sessions.sessionType === 'loan_signing') {
    notaryFee = '125.00'
  }
  let notaryFeeFloat = parseFloat(notaryFee) * 100

  if (notaryUserDoc.notaryCustomCharges) {
    let extraChargesDocs = [];
    if (sessions.sessionType) {
      extraChargesDocs = notaryUserDoc.notaryCustomCharges[sessions.sessionType] || [];
    } else {
      extraChargesDocs = notaryUserDoc.notaryCustomCharges.gnw || [];
    }
    console.log('extraChargesDocs', extraChargesDocs)
    _.map(extraChargesDocs, (extraChargeDoc) => {
      const extraChargeAmount = parseFloat(extraChargeDoc.amount) * 100;
      notaryFeeFloat += extraChargeAmount
    });
    console.log('notaryFeeFloat', notaryFeeFloat)
  }

  // let serviceFee = '2.00';
  // if (pricingDoc && pricingDoc.serviceFee) {
  //   serviceFee = pricingDoc.serviceFee;
  // }
  // const serviceFeeFloat = parseFloat(serviceFee) * 100

  let extraSeal = '8.00';
  if (pricingDoc && pricingDoc.extraSeal) {
    extraSeal = pricingDoc.extraSeal;
  }
  // const extraSealFloat = parseFloat(extraSeal) * 100
  const extraSealFloatUsd = parseFloat(extraSeal)

  // charge the customer
  let totalCost = 0;
  if (sessions.finalCostOfNotarization !== null) {
    totalCost = parseFloat(sessions.finalCostOfNotarization.replace('$', '')) * 100;
  }

  // Full Notary Charges are going to BN. So not adding any Notary charges calculation here

  let notaryCharges = 0
  const stripeCharges = 30 + parseInt(String(totalCost * 2.9 / 100), 10)

  let witnessChargesPaid = false;
  _.map(sessions.costOfNotarization, (costDoc) => {
    if (costDoc.name.includes('Witness') || costDoc.name.includes('witness')) {
      witnessChargesPaid = true
    }
  })

  if (statePricingUsed) {
    _.map(sessions.costOfNotarization, (costDoc) => {
      if (costDoc.name.indexOf('Notarization') !== -1) {
        notaryCharges += notaryFeeFloat
      } else if (costDoc.name.indexOf('Extra') !== -1) {
        const extraSeals = parseInt(String(parseFloat(costDoc.price) / extraSealFloatUsd), 10)
        notaryCharges += (extraSeals * 400)
      }
    })
    // notaryCharges += (0.5 * serviceFeeFloat)
  } else {
    _.map(sessions.costOfNotarization, (costDoc) => {
      if (costDoc.name.indexOf('Notarization') !== -1) {
        notaryCharges += notaryFeeFloat
      } else if (costDoc.name.indexOf('Extra') !== -1) {
        const extraSeals = parseInt(String(parseFloat(costDoc.price) / extraSealFloatUsd), 10)
        notaryCharges += (extraSeals * 400)
      }
    })
  }

  let bnCharges = 0
  let notaryStripeAccountName = ''

  const notarydm = await NotaryDataModel.findOne({userId: sessions.notaryUserId})

  if (notarydm && notarydm.stripeAccountName) {
    notaryStripeAccountName = notarydm.stripeAccountName
    bnCharges = totalCost - notaryCharges
    // bnCharges = totalCost - notaryCharges - stripeCharges
  }
  console.log(totalCost, bnCharges, notaryStripeAccountName, notaryCharges, stripeCharges)
  // const stripeChargesDoc = {
  //   amount: totalCost,
  //   description: `Charged for session #${sessions._id}`,
  //   currency: 'USD',
  //   customer: notaries.stripeCustomerID,
  //   application_fee_amount: null,
  //   transfer_data: {}
  // }

  // if (notaryStripeAccountName) {
  //   stripeChargesDoc.application_fee_amount = bnCharges;
  //   stripeChargesDoc.transfer_data = {
  //     destination: notaryStripeAccountName
  //     // amount: notaryCharges
  //   }
  // } else {
  //   delete stripeChargesDoc.application_fee_amount
  //   delete stripeChargesDoc.transfer_data
  // }
  // console.log('stripeChargesDoc', stripeChargesDoc)

  let stripeToUse;
  if (user.testingacc) {
    stripeToUse = stripeTest
  } else {
    stripeToUse = stripe
  }

  const stripeChargesDoc = {
    amount: totalCost,
    description: `Charged for session #${sessions._id}`,
    currency: 'USD',
    customer: notaries.stripeCustomerID,
    transfer_data: {}
  }
  const charge = await stripeToUse.charges.create(stripeChargesDoc);
  console.log('charge', charge)

  // Implementing the mechanism where BN gets full payment, and then BN disburses
  // the sub payments to needed parties using stripe payment intent and stripe transfers
  const transferGroup = sessions._id + '_' + Math.floor(Math.random() * 999)

  let paymentIntentCost = 0
  const allStripeTransfers = []

  if (notaryStripeAccountName) {
    console.log('notaryCharges', notaryCharges)
    allStripeTransfers.push({
      amount: notaryCharges,
      currency: 'usd',
      destination: notaryStripeAccountName,
      transfer_group: transferGroup,
      source_transaction: charge.id
    })
    paymentIntentCost += notaryCharges
  }

  if (witnessChargesPaid) {
    // Currently Supporting only 1 session witness from BN
    // Witness cost is 10$. 5 goes to BN, 5 goes to witness notary
    const allUserSessionWitnesses = await SessionWitness.findOne({
      sessionid: sessions._id,
      userid: {$exists: true}
    })

    if (allUserSessionWitnesses) {
      const sessionUserNotaryDoc = await NotaryDataModel.findOne({userId: allUserSessionWitnesses.userid})
      if (sessionUserNotaryDoc && sessionUserNotaryDoc.stripeAccountName) {
        allStripeTransfers.push({
          amount: 500,
          currency: 'usd',
          destination: sessionUserNotaryDoc.stripeAccountName,
          transfer_group: transferGroup,
          source_transaction: charge.id
        })
        paymentIntentCost += 500
      }
    }
  }

  const paymentIntent = await stripeToUse.paymentIntents.create({
    amount: paymentIntentCost,
    currency: 'usd',
    transfer_group: transferGroup
  });

  console.log('paymentIntent', paymentIntent)
  console.log('allStripeTransfers', allStripeTransfers)

  _.map(allStripeTransfers, (internalStripeTransfer) => {
    stripeToUse.transfers.create(internalStripeTransfer)
  })

  if (charge && charge.paid === true) {
    sessions.paid = true
    sessions.stripePaymentData = {
      chargeId: charge.id,
      customerId: charge.customer,
      paid: charge.paid,
      receiptUrl: charge.receipt_url,
      status: charge.status
    }
    await sessions.save();
    paymentDone = 'success'
  } else {
    sessions.paid = false
    console.log('sessions.paid', sessions.paid)
    await sessions.save();
  }
  return paymentDone
}

const saveTheIndividualFailedStreams = async (sessiondoc, fileNamesList) =>  {
  try {
    await Promise.all(_.map(fileNamesList, async (filename) => {
      const fileContent = fs.readFileSync(filename);
      const stats = fs.statSync(filename)
      const objectKey = filename.replace('./tmp/', '')
      const signedFile = await upload(process.env.AWSBucket, objectKey, fileContent, 'video/webm')
      const uploadedDocument = new DocumentModel({
        sessionid: sessiondoc._id,
        documentCategory: 'temp_video_recording_file',
        name: objectKey,
        url: signedFile.Location,
        type: 'video/webm',
        size: stats.size,
        key: objectKey,
        bucketName: signedFile.Bucket,
        uploadedStage: 'document_with_dc'
      });
      await uploadedDocument.save();
    }));
  } catch (error) {
    console.log('error')
    _.map(fileNamesList, (tempfile) => {
      try {
        fs.unlinkSync(tempfile);
      } catch (error) {
        console.log(error)
      }
    })
  }
}

const checkIfDCPasswordIsValid = async(p12Key, dcPassword) => {
  try {
    let pdfKey = '1650390519829Deed-of-Trust.pdf'
    console.log(process.env.NODE_ENV)
    if (process.env.NODE_ENV === 'development') {
      pdfKey = '1647080435440test_order.pdf'
    }
    const pdf = await getObject(process.env.AWSBucket, pdfKey);
    const PdfBody = pdf.Body as string
    const pdfDoc = await PDFDocument.load(PdfBody, {
      ignoreEncryption: true
    });
    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
    const pdfBuffer = Buffer.from(pdfBytes)
    let objectKeyStr = p12Key;
    if (!p12Key.includes('.p12') && !p12Key.includes('.pfx')) {
      objectKeyStr = p12Key + '.p12'
    }
    console.log('objectKeyStr', objectKeyStr)
    const DCBuffer = await getObject(process.env.AWSBucket, objectKeyStr);
    const signatureLength = DCBuffer.Body.toString().length
    const inputBuffer = plainAddPlaceholder({
      pdfBuffer,
      reason: 'Signed Certificate By Blue Notary.',
      contactInfo: 'test',
      name: 'test',
      location: 'US',
      signatureLength
    });
    signer.sign(inputBuffer, DCBuffer.Body, {passphrase: dcPassword || 'bnDCpwd21'})
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

const checkBackPhotoId = async (backFileKey, sessionid, fileName) => {
  try {
    const pdf = await getObject(process.env.AWSBucket, backFileKey);
    const PdfBody = pdf.Body as string
    let inputFile = './tmp/' + String(sessionid) + String(fileName)
    console.log('initial', inputFile)
    inputFile = inputFile.replace(/[^a-zA-Z.\/\-\_0-9]/g, '')
    console.log('after', inputFile)
    await fs.writeFileSync(inputFile, PdfBody)
    const { stdout, stderr } = await exec('zxing --try-harder ' + inputFile);
    fs.unlinkSync(inputFile);
    console.log('stdout', stdout)
    console.log('stderr', stderr)
    let backImagePassed = false;
    if (_.includes(stdout, 'Decoded TEXT')) {
      backImagePassed = true
    }
    if (_.includes(stdout, 'Failed')) {
      backImagePassed = false
    }
    console.log('backImagePassed', backImagePassed)
    return backImagePassed;
  } catch (error) {
    console.log(error)
    return false
  }
}
exports.createCustomerBillingPortal = async (req, res) => {
  try {
    const user = req.user
    req = matchedData(req);

    const notarydm = await NotaryDataModel.findOne({ userId: user._id });

    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }

    if (notarydm && notarydm.stripeAccountName) {
      // const account = await stripeToUse.accounts.retrieve(
      //   notarydm.stripeAccountName
      // );
      // res.status(200).json({account});
      const session = await stripeToUse.billingPortal.sessions.create({
        customer: notarydm.stripeAccountName,
        return_url: 'http://localhost:8080'
      });

      res.redirect(session.url);

    }

    // Authenticate your user.
  } catch (error) {
    utils.handleError(res, error);
  }
};

exports.createCustomerPortalSession = async (req, res) => {
  try {
    const user = req.user
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    if (!notarydm) {
      return res.status(400).json({
        error: true,
        errorMessage: 'Notary Data not found'
      })
    }
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    let returnUrl = 'https://app.bluenotary.us/notary/account-settings'
    if (process.env.NODE_ENV === 'development') {
      returnUrl = 'http://localhost:8080/notary/account-settings'
    }
    const notaries = await IdentityModel.findOne({ userId: user._id })
    const { stripeCustomerID = null } = notaries;
    if (!notaries || !stripeCustomerID) {
      return res.status(400).json({
        error: true,
        errorMessage: 'Notary Stripe customerId not found'
      })
    } else {
      const session = await stripeToUse.billingPortal.sessions.create({
        customer: stripeCustomerID,
        return_url: returnUrl
      });
      res.redirect(session.url);
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.notaryEmailLogoUpload = async (req, res) => {
  try {
    const file = req.file
    const user = req.user
    req = matchedData(req);
    if (file) {
      const notaryUser = await User.findOne({_id: user._id});
      if (notaryUser) {
        const updatedNotaryUser = await User.findByIdAndUpdate(notaryUser.id,
        {$set: {emailLogoName: file.originalname, emailLogoUrl: file.location, emailLogoKey: file.key}},
        {new: true}).exec();
        res.status(200).json({
          message: 'Logo uploaded successfully.',
          user: updatedNotaryUser
        });
      }

    } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.updateEmailCustomMessage = async (req, res) => {
  try {
    const user = req.user
    const body = req.body;
    const notaryUser = await User.findOne({_id: user._id});

    if (notaryUser) {
        const updatedNotaryUser = await User.findByIdAndUpdate(
          notaryUser.id, {$set: {emailCustomMessage: body.customMessage }}, {new: true}
        ).exec();
        res.status(200).json({
          message: 'Message saved successfully.',
          user: updatedNotaryUser
        });
      } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.updateEmailSetting = async (req, res) => {
  try {
    const user = req.user
    const body = req.body;
    const notaryUser = await User.findOne({_id: user._id});

    if (notaryUser) {
        const updatedNotaryUser = await User.findByIdAndUpdate(
          notaryUser.id, {$set: {sendBrandEmails: body.sendBrandEmails }}, {new: true}
        ).exec();
        res.status(200).json({
          message: 'Setting updated successfully.',
          user: updatedNotaryUser
        });
      } else {
      res.status(200).json({ error: true });
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
exports.createCustomerPortalSession = async (req, res) => {
  try {
    const user = req.user
    const notarydm = await NotaryDataModel.findOne({ userId: user._id })
    if (!notarydm) {
      return res.status(400).json({
        error: true,
        errorMessage: 'Notary Data not found'
      })
    }
    let stripeToUse;
    if (user.testingacc) {
      stripeToUse = stripeTest
    } else {
      stripeToUse = stripe
    }
    let returnUrl = 'https://app.bluenotary.us/notary/account-settings'
    if (process.env.NODE_ENV === 'development') {
      returnUrl = 'http://localhost:8080/notary/account-settings'
    }
    const notaries = await IdentityModel.findOne({ userId: user._id })
    const { stripeCustomerID = null } = notaries;
    if (!notaries || !stripeCustomerID) {
      return res.status(400).json({
        error: true,
        errorMessage: 'Notary Stripe customerId not found'
      })
    } else {
      const session = await stripeToUse.billingPortal.sessions.create({
        customer: stripeCustomerID,
        return_url: returnUrl
      });
      res.redirect(session.url);
    }
  } catch (error) {
    utils.handleError(res, error);
  }
};
