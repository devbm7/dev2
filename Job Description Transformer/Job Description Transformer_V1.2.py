#!/usr/bin/env python3
"""
Job Description Parser - Improved Version with Fallbacks
Extracts structured information from job descriptions using NLP techniques
Handles missing dependencies gracefully
"""

import json
import re
import sys
import os
from typing import List, Dict, Optional, Union
from datetime import datetime
import hashlib
from dataclasses import dataclass
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DependencyChecker:
    """Check and manage dependencies"""
    
    def __init__(self):
        self.spacy_available = False
        self.transformers_available = False
        self.nltk_available = False
        
        self._check_dependencies()
    
    def _check_dependencies(self):
        """Check which dependencies are available"""
        
        # Check spaCy
        try:
            import spacy
            try:
                spacy.load("en_core_web_sm")
                self.spacy_available = True
                logger.info("✓ spaCy with en_core_web_sm model is available")
            except OSError:
                logger.warning("⚠ spaCy is installed but en_core_web_sm model is missing")
                logger.warning("Run: python -m spacy download en_core_web_sm")
        except ImportError:
            logger.warning("⚠ spaCy is not installed")
        
        # Check transformers
        try:
            import transformers
            import torch
            self.transformers_available = True
            logger.info("✓ Transformers and PyTorch are available")
        except ImportError:
            logger.warning("⚠ Transformers or PyTorch not available")
        
        # Check NLTK
        try:
            import nltk
            self.nltk_available = True
            logger.info("✓ NLTK is available")
        except ImportError:
            logger.warning("⚠ NLTK is not installed")

class JobDescriptionParser:
    """Main parser class with fallback mechanisms"""
    
    def __init__(self):
        """Initialize the parser with available NLP tools"""
        self.dep_checker = DependencyChecker()
        self.nlp = None
        
        # Initialize NLP components
        self._init_nlp_components()
        self._init_patterns()
        
        logger.info("Job Description Parser initialized successfully")
    
    def _init_nlp_components(self):
        """Initialize NLP components based on available dependencies"""
        
        if self.dep_checker.spacy_available:
            try:
                import spacy
                self.nlp = spacy.load("en_core_web_sm")
                logger.info("Using spaCy for NLP processing")
            except Exception as e:
                logger.warning(f"Failed to load spaCy: {e}")
                self.nlp = None
        
        if self.dep_checker.nltk_available:
            try:
                import nltk
                # Download required NLTK data if not present
                try:
                    nltk.data.find('tokenizers/punkt')
                except LookupError:
                    logger.info("Downloading NLTK punkt tokenizer...")
                    nltk.download('punkt')
                
                try:
                    nltk.data.find('taggers/averaged_perceptron_tagger')
                except LookupError:
                    logger.info("Downloading NLTK POS tagger...")
                    nltk.download('averaged_perceptron_tagger')
                    
            except Exception as e:
                logger.warning(f"NLTK setup failed: {e}")
    
    def _init_patterns(self):
        """Initialize regex patterns for extracting information"""
        
        # Salary patterns
        self.salary_patterns = [
            r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-|to)\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'\$(\d{1,3}(?:,\d{3})*)\s*k?\s*(?:-|to)\s*\$?(\d{1,3}(?:,\d{3})*)\s*k?',
            r'(\d{1,3}(?:,\d{3})*)\s*(?:-|to)\s*(\d{1,3}(?:,\d{3})*)\s*(?:per year|annually|\/year)',
        ]
        
        # Experience patterns
        self.experience_patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
            r'(\d+)\+?\s*years?\s*in',
            r'minimum\s*(?:of\s*)?(\d+)\s*years?',
            r'at least\s*(\d+)\s*years?'
        ]
        
        # Education patterns
        self.education_patterns = [
            r'bachelor\'?s?\s*(?:degree)?',
            r'master\'?s?\s*(?:degree)?',
            r'phd|doctorate',
            r'associate\'?s?\s*(?:degree)?'
        ]
        
        # Technical skills database
        self.tech_skills = {
            'programming_languages': [
                'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust',
                'swift', 'kotlin', 'scala', 'ruby', 'php', 'r', 'matlab', 'sql'
            ],
            'frameworks': [
                'react', 'angular', 'vue', 'django', 'flask', 'spring', 'express',
                'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy'
            ],
            'databases': [
                'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
                'cassandra', 'dynamodb', 'sqlite', 'oracle'
            ],
            'cloud_platforms': [
                'aws', 'azure', 'gcp', 'google cloud', 'kubernetes', 'docker'
            ],
            'tools': [
                'git', 'jenkins', 'jira', 'confluence', 'slack', 'tableau', 'power bi'
            ]
        }
        
        # Soft skills database
        self.soft_skills_list = [
            'communication', 'teamwork', 'leadership', 'problem solving',
            'analytical', 'creative', 'adaptable', 'organized', 'detail oriented',
            'time management', 'collaboration', 'critical thinking', 'mentoring'
        ]
        
        # Employment type patterns
        self.employment_patterns = {
            'full-time': r'full[\s-]?time',
            'part-time': r'part[\s-]?time',
            'contract': r'contract|contractor|freelance',
            'internship': r'intern|internship',
            'temporary': r'temporary|temp'
        }
        
        # Location patterns
        self.location_patterns = {
            'remote': r'remote|work from home|telecommute',
            'hybrid': r'hybrid|flexible',
            'onsite': r'on[\s-]?site|in[\s-]?office'
        }

    def generate_job_id(self, title: str, company: str = "unknown") -> str:
        """Generate a unique job ID"""
        content = f"{title}-{company}-{datetime.now().isoformat()}"
        return hashlib.md5(content.encode()).hexdigest()[:12]

    def extract_named_entities(self, text: str) -> List[Dict]:
        """Extract named entities using available NLP tools"""
        entities = []
        
        if self.nlp:
            # Use spaCy if available
            doc = self.nlp(text)
            for ent in doc.ents:
                entities.append({
                    'text': ent.text,
                    'label': ent.label_,
                    'start': ent.start_char,
                    'end': ent.end_char
                })
        elif self.dep_checker.nltk_available:
            # Fallback to NLTK
            try:
                import nltk
                from nltk import ne_chunk, pos_tag, word_tokenize
                
                tokens = word_tokenize(text)
                pos_tags = pos_tag(tokens)
                chunks = ne_chunk(pos_tags)
                
                # Extract named entities from chunks
                for chunk in chunks:
                    if hasattr(chunk, 'label'):
                        entity_text = ' '.join([token for token, pos in chunk.leaves()])
                        entities.append({
                            'text': entity_text,
                            'label': chunk.label(),
                            'start': 0,  # NLTK doesn't provide char positions easily
                            'end': 0
                        })
            except Exception as e:
                logger.warning(f"NLTK entity extraction failed: {e}")
        
        return entities

    def extract_core_details(self, text: str) -> Dict:
        """Extract core job details"""
        
        # Extract job title
        title = self._extract_job_title(text)
        
        # Extract job summary
        summary = self._extract_job_summary(text)
        
        # Extract employment type
        employment_type = self._extract_employment_type(text)
        
        # Extract location
        location = self._extract_location(text)
        
        return {
            "title": title,
            "jobSummary": summary,
            "employmentType": employment_type,
            "jobLocation": location,
            "customTags": [],
            "extraNotes": ""
        }

    def _extract_job_title(self, text: str) -> str:
        """Extract job title from text"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        # Look for title in first few lines
        for line in lines[:5]:
            if len(line) > 10 and len(line) < 100:
                # Common job title keywords
                title_keywords = [
                    'engineer', 'developer', 'manager', 'analyst', 'specialist',
                    'lead', 'senior', 'junior', 'principal', 'architect', 'consultant'
                ]
                
                if any(keyword in line.lower() for keyword in title_keywords):
                    return line
        
        # Fallback patterns
        title_patterns = [
            r'(?:position|role|job\s*title|title)\s*:?\s*(.+?)(?:\n|$)',
            r'^(.+?)(?:\s*-\s*(?:job|position|role))',
        ]
        
        for pattern in title_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                return match.group(1).strip()
        
        return "Software Engineer"  # Default

    def _extract_job_summary(self, text: str) -> str:
        """Extract job summary"""
        # Look for summary sections
        summary_patterns = [
            r'(?:job\s*summary|summary|overview|description|about\s*the\s*role)\s*:?\s*(.+?)(?:\n\n|\n[A-Z])',
            r'^(.+?)(?:\n\n|\nResponsibilities|\nRequirements|\nQualifications)'
        ]
        
        for pattern in summary_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL | re.MULTILINE)
            if match:
                summary = match.group(1).strip()
                if len(summary) > 50:
                    # Clean up the summary
                    summary = re.sub(r'\s+', ' ', summary)  # Replace multiple spaces
                    return summary[:500]
        
        # Fallback: first meaningful paragraph
        paragraphs = [p.strip() for p in text.split('\n\n') if len(p.strip()) > 50]
        if paragraphs:
            return paragraphs[0][:500]
        
        return "Join our team in this exciting opportunity."

    def _extract_employment_type(self, text: str) -> Dict:
        """Extract employment type information"""
        text_lower = text.lower()
        
        # Determine agreement type
        agreement = "Employee"
        if re.search(r'contract|contractor|freelance', text_lower):
            agreement = "Contractor"
        elif re.search(r'intern|internship', text_lower):
            agreement = "Intern"
        
        # Determine schedule
        schedule = "Full-time"
        for sched_type, pattern in self.employment_patterns.items():
            if re.search(pattern, text_lower):
                schedule = sched_type.replace('-', '-').title()
                break
        
        # Determine term
        term = "Permanent"
        if re.search(r'temporary|temp|contract', text_lower):
            term = "Temporary"
        
        return {
            "agreement": agreement,
            "schedule": schedule,
            "term": term
        }

    def _extract_location(self, text: str) -> Dict:
        """Extract location information"""
        text_lower = text.lower()
        
        # Determine location type
        location_type = "TELECOMMUTE"
        if re.search(self.location_patterns['remote'], text_lower):
            location_type = "TELECOMMUTE"
        elif re.search(self.location_patterns['hybrid'], text_lower):
            location_type = "HYBRID"
        elif re.search(self.location_patterns['onsite'], text_lower):
            location_type = "ONSITE"
        
        # Extract locations using NER if available
        entities = self.extract_named_entities(text)
        locations = [ent['text'] for ent in entities if ent['label'] in ['GPE', 'LOC', 'LOCATION']]
        
        # Determine applicant requirement
        applicant_req = "USA"
        if any(term in text_lower for term in ['international', 'global', 'worldwide']):
            applicant_req = "Global"
        elif any(country in text_lower for country in ['canada', 'uk', 'europe']):
            applicant_req = "North America"
        
        return {
            "type": location_type,
            "applicantLocationRequirement": applicant_req
        }

    def extract_responsibilities(self, text: str) -> Dict:
        """Extract responsibilities and duties"""
        
        # Find responsibilities section
        resp_section = self._find_section(text, [
            'responsibilities', 'duties', 'what you.ll do', 'role', 'key tasks',
            'you will', 'job duties'
        ])
        
        # Extract objectives and duties
        objectives = self._extract_objectives(resp_section)
        duties = self._extract_duties(resp_section)
        
        return {
            "keyObjectives": objectives,
            "dayToDayDuties": duties,
            "customTags": [],
            "extraNotes": ""
        }

    def _find_section(self, text: str, keywords: List[str]) -> str:
        """Find a section in text based on keywords"""
        for keyword in keywords:
            pattern = rf'(?:{keyword})\s*:?\s*(.+?)(?:\n\n|\n[A-Z][a-z]+:|\n(?:Requirements|Qualifications|Benefits)|$)'
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group(1)
        
        return text  # Return full text if no section found

    def _extract_objectives(self, text: str) -> List[Dict]:
        """Extract key objectives with metrics"""
        objectives = []
        
        # Look for performance metrics
        metric_patterns = [
            r'improve.+?(\d+%)',
            r'increase.+?(\d+%)',
            r'reduce.+?(\d+%)',
            r'achieve.+?(\d+%)',
            r'deliver.+?within (\d+\s*(?:days|weeks|months))'
        ]
        
        for pattern in metric_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                objectives.append({
                    "objective": match.group(0).strip(),
                    "timeframe": "6 months",
                    "metric": "Performance Metric"
                })
        
        return objectives[:3]

    def _extract_duties(self, text: str) -> List[str]:
        """Extract day-to-day duties"""
        duties = []
        
        # Split by common bullet point markers
        lines = re.split(r'[\n•\-\*]\s*', text)
        
        action_verbs = [
            'develop', 'build', 'create', 'design', 'implement', 'maintain',
            'collaborate', 'work', 'support', 'manage', 'lead', 'coordinate',
            'analyze', 'optimize', 'troubleshoot', 'mentor', 'review'
        ]
        
        for line in lines:
            line = line.strip()
            if 20 <= len(line) <= 200:  # Reasonable length
                if any(verb in line.lower() for verb in action_verbs):
                    duties.append(line)
        
        return duties[:10]

    def extract_qualifications(self, text: str) -> Dict:
        """Extract qualifications and requirements"""
        
        # Find qualifications section
        qual_section = self._find_section(text, [
            'requirements', 'qualifications', 'skills', 'must have',
            'preferred', 'desired', 'ideal candidate'
        ])
        
        # Extract components
        required_years = self._extract_experience_years(qual_section)
        exp_description = self._extract_experience_description(qual_section)
        education = self._extract_education_requirements(qual_section)
        technical_skills = self._extract_technical_skills(qual_section)
        soft_skills = self._extract_soft_skills(qual_section)
        
        return {
            "skills": {
                "technical": technical_skills,
                "soft": soft_skills
            },
            "experience": {
                "requiredYears": required_years,
                "description": exp_description
            },
            "education": education,
            "customTags": [],
            "extraNotes": ""
        }

    def _extract_experience_years(self, text: str) -> int:
        """Extract required years of experience"""
        for pattern in self.experience_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    years = int(match.group(1))
                    if 0 <= years <= 20:
                        return years
                except (ValueError, IndexError):
                    continue
        return 3  # Default

    def _extract_experience_description(self, text: str) -> str:
        """Extract experience description"""
        exp_patterns = [
            r'experience.{0,200}(?:building|developing|working|managing)',
            r'(?:background|experience) in.{0,100}',
        ]
        
        for pattern in exp_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                desc = match.group(0).strip()
                return re.sub(r'\s+', ' ', desc)[:200]
        
        return "Experience in relevant technology stack and domain."

    def _extract_education_requirements(self, text: str) -> Dict:
        """Extract education requirements"""
        text_lower = text.lower()
        
        # Determine credential level
        credential = "Bachelor's Degree"
        if re.search(r'master|msc|ms\b', text_lower):
            credential = "Master's Degree"
        elif re.search(r'phd|doctorate', text_lower):
            credential = "PhD"
        elif re.search(r'associate', text_lower):
            credential = "Associate's Degree"
        
        # Add field if specified
        if re.search(r'computer science', text_lower):
            credential += " in Computer Science"
        elif re.search(r'engineering', text_lower):
            credential += " in Engineering"
        elif re.search(r'mathematics', text_lower):
            credential += " in Mathematics"
        
        # Check for experience substitution
        accepts_experience = bool(re.search(
            r'(?:or|equivalent)\s*experience|experience\s*(?:in lieu|instead)|degree\s*(?:or|\/)\s*equivalent',
            text_lower
        ))
        
        return {
            "requiredCredential": credential,
            "acceptsExperienceInLieu": accepts_experience
        }

    def _extract_technical_skills(self, text: str) -> List[str]:
        """Extract technical skills"""
        text_lower = text.lower()
        found_skills = []
        
        # Check all skill categories
        for category, skills in self.tech_skills.items():
            for skill in skills:
                # Use word boundaries to avoid partial matches
                pattern = rf'\b{re.escape(skill)}\b'
                if re.search(pattern, text_lower):
                    found_skills.append(skill)
        
        # Remove duplicates and return
        return list(set(found_skills))

    def _extract_soft_skills(self, text: str) -> List[str]:
        """Extract soft skills"""
        text_lower = text.lower()
        found_skills = []
        
        for skill in self.soft_skills_list:
            pattern = rf'\b{re.escape(skill)}\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill)
        
        return found_skills

    def extract_company_context(self, text: str) -> Dict:
        """Extract company culture and growth opportunities"""
        
        # Look for culture section
        culture_section = self._find_section(text, [
            'culture', 'values', 'environment', 'team', 'company', 'about us'
        ])
        
        culture = "We value collaboration and innovation."
        if len(culture_section) > 50:
            culture = culture_section[:200]
        
        # Look for growth opportunities
        growth_section = self._find_section(text, [
            'growth', 'career', 'advancement', 'opportunity', 'learning', 'development'
        ])
        
        growth = "Opportunities for professional development and career advancement."
        if len(growth_section) > 50:
            growth = growth_section[:200]
        
        return {
            "culture": culture,
            "growthOpportunities": growth,
            "customTags": [],
            "extraNotes": ""
        }

    def extract_compensation(self, text: str) -> Dict:
        """Extract salary and benefits"""
        
        salary_range = self._extract_salary_range(text)
        benefits = self._extract_benefits(text)
        
        return {
            "salary": salary_range,
            "benefits": benefits,
            "customTags": [],
            "extraNotes": ""
        }

    def _extract_salary_range(self, text: str) -> Dict:
        """Extract salary range"""
        
        for pattern in self.salary_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    min_sal = int(re.sub(r'[^\d]', '', match.group(1)))
                    max_sal = int(re.sub(r'[^\d]', '', match.group(2)))
                    
                    # Handle 'k' notation
                    if 'k' in match.group(0).lower():
                        min_sal *= 1000
                        max_sal *= 1000
                    
                    # Validate range
                    if 20000 <= min_sal <= 500000 and min_sal < max_sal:
                        return {
                            "min": min_sal,
                            "max": max_sal,
                            "currency": "USD"
                        }
                except (ValueError, IndexError):
                    continue
        
        # Default range
        return {
            "min": 80000,
            "max": 120000,
            "currency": "USD"
        }

    def _extract_benefits(self, text: str) -> List[str]:
        """Extract benefits"""
        benefits_keywords = [
            'health insurance', 'dental', 'vision', '401k', 'retirement',
            'pto', 'vacation', 'sick leave', 'flexible schedule',
            'work from home', 'remote work', 'stock options', 'equity',
            'bonuses', 'gym membership', 'learning stipend', 'tuition reimbursement',
            'life insurance', 'disability insurance', 'childcare', 'commuter benefits'
        ]
        
        text_lower = text.lower()
        found_benefits = []
        
        for benefit in benefits_keywords:
            if benefit in text_lower:
                found_benefits.append(benefit.title())
        
        return found_benefits

    def generate_interview_guidance(self, qualifications: Dict, responsibilities: Dict) -> Dict:
        """Generate interview guidance based on job requirements"""
        
        # Create competency profile
        competency_profile = []
        
        # Add technical competencies
        for skill in qualifications['skills']['technical'][:5]:
            competency_profile.append({
                "competency": skill.title(),
                "importance": "High",
                "assessmentMethod": "Technical Interview"
            })
        
        # Add soft skill competencies
        for skill in qualifications['skills']['soft'][:3]:
            competency_profile.append({
                "competency": skill.title(),
                "importance": "Medium",
                "assessmentMethod": "Behavioral Interview"
            })
        
        # Generate interview flow
        interview_flow = [
            {
                "stage": "Technical Round",
                "objective": "Evaluate technical skills and problem-solving approach",
                "durationMinutes": 60,
                "mode": "Live Coding + Discussion",
                "evaluators": ["Senior Engineer", "Tech Lead"],
                "questions": self._generate_technical_questions(qualifications['skills']['technical'])
            },
            {
                "stage": "Behavioral Round",
                "objective": "Assess cultural fit and soft skills",
                "durationMinutes": 45,
                "mode": "One-on-One",
                "evaluators": ["Engineering Manager"],
                "questions": self._generate_behavioral_questions(qualifications['skills']['soft'])
            }
        ]
        
        return {
            "competencyProfile": competency_profile,
            "assessmentPlan": [],
            "interviewFlow": interview_flow,
            "customTags": [],
            "extraNotes": "Tailor questions based on candidate's background and experience level."
        }

    def _generate_technical_questions(self, technical_skills: List[str]) -> List[Dict]:
        """Generate technical interview questions"""
        questions = []
        
        # Generic system design question
        questions.append({
            "questionText": "Design a scalable web application architecture for high traffic",
            "type": "Open-Ended",
            "topic": "System Design",
            "expectedSkills": ["Architecture", "Scalability", "System Design"]
        })
        
        # Skill-specific questions
        if 'python' in [skill.lower() for skill in technical_skills]:
            questions.append({
                "questionText": "Explain Python's memory management and garbage collection",
                "type": "Discussion",
                "topic": "Python",
                "expectedSkills": ["Python", "Memory Management"]
            })
        
        if any(db in [skill.lower() for skill in technical_skills] 
               for db in ['mysql', 'postgresql', 'mongodb', 'sql']):
            questions.append({
                "questionText": "Design a database schema for an e-commerce platform",
                "type": "Open-Ended",
                "topic": "Database Design",
                "expectedSkills": ["Database Design", "SQL", "Data Modeling"]
            })
        
        if any(cloud in [skill.lower() for skill in technical_skills] 
               for cloud in ['aws', 'azure', 'gcp', 'kubernetes']):
            questions.append({
                "questionText": "How would you deploy a microservices application on the cloud?",
                "type": "Discussion",
                "topic": "Cloud Architecture",
                "expectedSkills": ["Cloud Computing", "DevOps", "Microservices"]
            })
        
        return questions

    def _generate_behavioral_questions(self, soft_skills: List[str]) -> List[Dict]:
        """Generate behavioral interview questions"""
        questions = []
        
        # Standard behavioral questions
        questions.append({
            "questionText": "Tell me about a challenging project you worked on and how you overcame obstacles",
            "type": "Behavioral",
            "topic": "Problem Solving",
            "expectedSkills": ["Problem Solving", "Resilience", "Communication"]
        })
        
        if 'leadership' in [skill.lower() for skill in soft_skills]:
            questions.append({
                "questionText": "Describe a time when you had to lead a team through a difficult situation",
                "type": "Behavioral",
                "topic": "Leadership",
                "expectedSkills": ["Leadership", "Team Management", "Decision Making"]
            })
        
        if 'communication' in [skill.lower() for skill in soft_skills]:
            questions.append({
                "questionText": "How do you explain complex technical concepts to non-technical stakeholders?",
                "type": "Reflective",
                "topic": "Communication",
                "expectedSkills": ["Communication", "Technical Writing", "Stakeholder Management"]
            })
        
        if 'collaboration' in [skill.lower() for skill in soft_skills] or 'teamwork' in [skill.lower() for skill in soft_skills]:
            questions.append({
                "questionText": "Tell me about a time you had to work with a difficult team member",
                "type": "Behavioral",
                "topic": "Teamwork",
                "expectedSkills": ["Collaboration", "Conflict Resolution", "Empathy"]
            })
        
        return questions

    def parse_job_description(self, job_text: str, company_name: str = "Unknown Company") -> Dict:
        """Main method to parse a complete job description"""
        try:
            logger.info("Starting job description parsing...")
            
            # Generate job ID
            job_id = self.generate_job_id(job_text[:100], company_name)
            
            # Extract all sections
            core_details = self.extract_core_details(job_text)
            responsibilities = self.extract_responsibilities(job_text)
            qualifications = self.extract_qualifications(job_text)
            company_context = self.extract_company_context(job_text)
            compensation = self.extract_compensation(job_text)
            interview_guidance = self.generate_interview_guidance(qualifications, responsibilities)
            
            # Create meta information
            meta = {
                "schemaVersion": "v1.1",
                "source": "NLP-Driven Extraction",
                "lastUpdated": str(int(datetime.now().timestamp())),
                "customFields": {
                    "processingMethod": "Pattern Matching + NLP",
                    "nlpToolsUsed": {
                        "spacy": self.dep_checker.spacy_available,
                        "nltk": self.dep_checker.nltk_available,
                        "transformers": self.dep_checker.transformers_available
                    },
                    "extractionTimestamp": datetime.now().isoformat()
                }
            }
            
            # Construct final job profile
            job_profile = {
                "jobProfile": {
                    "JobId": job_id,
                    "coreDetails": core_details,
                    "responsibilities": responsibilities,
                    "qualifications": qualifications,
                    "companyContext": company_context,
                    "compensation": compensation,
                    "interviewGuidance": interview_guidance,
                    "meta": meta
                }
            }
            
            logger.info(f"Successfully parsed job description. Job ID: {job_id}")
            return job_profile
            
        except Exception as e:
            logger.error(f"Error parsing job description: {e}")
            raise

    def save_to_json(self, job_profile: Dict, filename: str = None, output_dir: str = "output") -> str:
        """Save the job profile to a JSON file"""
        
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            logger.info(f"Created output directory: {output_dir}")
        
        if filename is None:
            job_id = job_profile['jobProfile']['JobId']
            filename = f"job_profile_{job_id}.json"
        
        filepath = os.path.join(output_dir, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(job_profile, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Job profile saved to {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Error saving job profile: {e}")
            raise

    def parse_from_file(self, file_path: str, company_name: str = "Unknown Company") -> Dict:
        """Parse job description from a text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                job_text = f.read()
            
            logger.info(f"Reading job description from: {file_path}")
            return self.parse_job_description(job_text, company_name)
            
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {e}")
            raise

    def batch_process(self, input_dir: str, output_dir: str = "output") -> List[str]:
        """Process multiple job descriptions from a directory"""
        processed_files = []
        
        if not os.path.exists(input_dir):
            logger.error(f"Input directory does not exist: {input_dir}")
            return processed_files
        
        # Find all text files in input directory
        text_files = [f for f in os.listdir(input_dir) if f.endswith(('.txt', '.md'))]
        
        if not text_files:
            logger.warning(f"No text files found in {input_dir}")
            return processed_files
        
        logger.info(f"Found {len(text_files)} files to process")
        
        for filename in text_files:
            try:
                file_path = os.path.join(input_dir, filename)
                company_name = filename.replace('.txt', '').replace('.md', '').replace('_', ' ').title()
                
                # Parse job description
                job_profile = self.parse_from_file(file_path, company_name)
                
                # Save result
                output_filename = f"parsed_{filename.replace('.txt', '.json').replace('.md', '.json')}"
                saved_path = self.save_to_json(job_profile, output_filename, output_dir)
                processed_files.append(saved_path)
                
                logger.info(f"✓ Processed: {filename}")
                
            except Exception as e:
                logger.error(f"✗ Failed to process {filename}: {e}")
        
        logger.info(f"Batch processing completed. {len(processed_files)} files processed successfully.")
        return processed_files

def main():
    """Main function for command-line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Job Description Parser")
    parser.add_argument('--input', '-i', help='Input job description file or directory')
    parser.add_argument('--output', '-o', default='output', help='Output directory (default: output)')
    parser.add_argument('--company', '-c', default='Unknown Company', help='Company name')
    parser.add_argument('--batch', '-b', action='store_true', help='Batch process directory')
    
    args = parser.parse_args()
    
    # Initialize parser
    job_parser = JobDescriptionParser()
    
    if args.input:
        if args.batch and os.path.isdir(args.input):
            # Batch processing
            processed_files = job_parser.batch_process(args.input, args.output)
            print(f"\nBatch processing completed!")
            print(f"Processed {len(processed_files)} files:")
            for file_path in processed_files:
                print(f"  - {file_path}")
        
        elif os.path.isfile(args.input):
            # Single file processing
            job_profile = job_parser.parse_from_file(args.input, args.company)
            saved_path = job_parser.save_to_json(job_profile, output_dir=args.output)
            print(f"\nJob description parsed successfully!")
            print(f"Output saved to: {saved_path}")
        
        else:
            print(f"Error: Input path '{args.input}' not found or invalid")
            return
    
    else:
        # Interactive mode with sample job description
        print("No input file specified. Running with sample job description...")
        
        sample_job_desc = """
        Senior Software Engineer - Cloud Platform
        
        Join our innovative team to build the next generation of cloud infrastructure 
        that serves millions of users worldwide. We're looking for a passionate engineer 
        who thrives in a collaborative environment.
        
        Responsibilities:
        • Design and develop scalable cloud-based applications using Python and Go
        • Improve system performance and reduce API latency by 25% over the next 6 months
        • Collaborate with cross-functional teams to deliver high-quality software
        • Mentor junior developers and contribute to architectural decisions
        • Implement best practices for security, monitoring, and reliability
        • Lead code reviews and ensure coding standards
        
        Requirements:
        • 5+ years of experience in software development with focus on distributed systems
        • Strong proficiency in Python, Go, or Java
        • Experience with AWS, Docker, and Kubernetes
        • Solid understanding of microservices architecture
        • Bachelor's degree in Computer Science or equivalent experience
        • Excellent communication and problem-solving skills
        • Experience with databases like PostgreSQL and Redis
        • Knowledge of CI/CD pipelines and DevOps practices
        
        Nice to Have:
        • Leadership experience mentoring team members
        • Experience with React and JavaScript
        • Knowledge of machine learning frameworks
        
        Benefits:
        We offer competitive compensation ($120k-$160k), comprehensive health insurance, 
        dental and vision coverage, 401k matching, flexible work arrangements, unlimited PTO,
        stock options, and a $5000 annual learning stipend.
        
        Company Culture:
        Our culture values innovation, collaboration, and work-life balance. We believe in 
        continuous learning and provide opportunities for professional growth through 
        conferences, training, and internal mobility programs.
        """
        
        # Parse the sample job description
        job_profile = job_parser.parse_job_description(sample_job_desc, "TechCorp Innovation Labs")
        
        # Save to JSON file
        saved_path = job_parser.save_to_json(job_profile, output_dir=args.output)
        
        print(f"\nSample job description parsed successfully!")
        print(f"Output saved to: {saved_path}")
        
        # Display summary
        profile = job_profile['jobProfile']
        print(f"\nExtracted Information Summary:")
        print(f"Job Title: {profile['coreDetails']['title']}")
        print(f"Experience Required: {profile['qualifications']['experience']['requiredYears']} years")
        print(f"Technical Skills Found: {len(profile['qualifications']['skills']['technical'])}")
        print(f"Soft Skills Found: {len(profile['qualifications']['skills']['soft'])}")
        print(f"Benefits Found: {len(profile['compensation']['benefits'])}")
        print(f"Interview Stages: {len(profile['interviewGuidance']['interviewFlow'])}")

if __name__ == "__main__":
    main()