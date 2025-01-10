const express = require('express');
const Resume = require('../models/resumeModel');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const htmlPdf = require('html-pdf-node');

const router = express.Router();

// Load the HTML template
const templatePath = path.join(__dirname, '..', 'resume-template.html');
const templateSource = fs.readFileSync(templatePath, 'utf8');

// Configure Handlebars to allow access to prototype properties
const template = Handlebars.compile(templateSource, {
  allowProtoPropertiesByDefault: true,
  allowProtoMethodsByDefault: true
});

// Create a new resume
router.post('/', async (req, res) => {
  try {
    const newResume = new Resume(req.body);
    const savedResume = await newResume.save(); 
    res.status(201).json(savedResume);
  } catch (error) {
    console.error('Error creating resume:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get all resumes
router.get('/', async (req, res) => {
  try {
    const resumes = await Resume.find();
    res.json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific resume
router.get('/:id', getResume, (req, res) => {
  res.json(res.resume);
});

// Get a specific resume as PDF
router.get('/:id/pdf', getResume, async (req, res) => {
  try {
    console.log('Generating PDF for resume:', res.resume._id);
    const resumeData = res.resume.toObject();
    const htmlContent = template(resumeData);

    const options = {
      format: 'A4',
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    };

    const file = { content: htmlContent };

    htmlPdf.generatePdf(file, options).then(pdfBuffer => {
      console.log('PDF generated successfully');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${resumeData.fullName.replace(' ', '_')}_resume.pdf"`);
      res.send(pdfBuffer);
    }).catch(error => {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: 'Error generating PDF', error: error.message });
    });
  } catch (error) {
    console.error('Error in PDF route:', error);
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
});

// Update a resume
router.patch('/:id', getResume, async (req, res) => {
  const updateFields = ['fullName', 'email', 'phone', 'location', 'workExperience', 'education', 'skills'];
  
  updateFields.forEach(field => {
    if (req.body[field] != null) {
      res.resume[field] = req.body[field];
    }
  });

  try {
    const updatedResume = await res.resume.save();
    res.json(updatedResume);
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a resume
router.delete('/:id', getResume, async (req, res) => {
  try {
    await res.resume.deleteOne();
    res.json({ message: 'Resume deleted' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ message: error.message });
  }
});

// Middleware function to get a resume by ID
async function getResume(req, res, next) {
  try {
    const resume = await Resume.findById(req.params.id);
    if (resume == null) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    res.resume = resume;
    next();
  } catch (error) {
    console.error('Error fetching resume:', error);
    return res.status(500).json({ message: error.message });
  }
}

module.exports = router;