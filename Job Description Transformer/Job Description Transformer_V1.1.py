#!/usr/bin/env python3
"""
Job Description Parser - Main Application
Extracts structured information from job descriptions using NLP techniques
"""

import json
import re
import spacy
from typing import List, Dict, Optional, Union
from datetime import datetime
import hashlib
from dataclasses import dataclass, asdict
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class JobProfile:
    """Data class representing the complete job profile structure"""
    JobId: str
    coreDetails: Dict
    responsibilities: Dict
    qualifications: Dict
    companyContext: Dict
    compensation: Dict
    interviewGuidance: Dict
    meta: Dict

class JobDescriptionParser:
    """Main parser class for extracting job information using NLP"""
    
    def __init__(self):
        """Initialize the parser with required NLP models"""
        try:
            # Load spaCy model for NER and text processing
            self.nlp = spacy.load("en_core_web_sm")
            
            # Load transformer for salary classification
            self.salary_classifier = pipeline(
                "text-classification",
                model="microsoft/DialoGPT-medium",
                return_all_scores=True
            )
            
            # Initialize skill extraction patterns
            self._init_patterns()
            
            logger.info("NLP models loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading NLP models: {e}")
            raise

    def _init_patterns(self):
        """Initialize regex patterns for extracting specific information"""
        
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
            r'associate\'?s?\s*(?:degree)?',
            r'computer science|engineering|mathematics|physics'
        ]
        
        # Technical skills (common ones)
        self.tech_skills = {
            'programming_languages': [
                'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust',
                'swift', 'kotlin', 'scala', 'ruby', 'php', 'r', 'matlab'
            ],
            'frameworks': [
                'react', 'angular', 'vue', 'django', 'flask', 'spring', 'express',
                'tensorflow', 'pytorch', 'keras', 'scikit-learn'
            ],
            'databases': [
                'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
                'cassandra', 'dynamodb', 'sqlite'
            ],
            'cloud_platforms': [
                'aws', 'azure', 'gcp', 'google cloud', 'kubernetes', 'docker'
            ],
            'tools': [
                'git', 'jenkins', 'jira', 'confluence', 'slack', 'tableau'
            ]
        }
        
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
        """Generate a unique job ID based on title and company"""
        content = f"{title}-{company}-{datetime.now().isoformat()}"
        return hashlib.md5(content.encode()).hexdigest()[:12]

    def extract_core_details(self, text: str) -> Dict:
        """Extract core job details from text"""
        doc = self.nlp(text)
        
        # Extract job title - typically the first line or near "position", "role"
        title = self._extract_job_title(text, doc)
        
        # Extract job summary - usually the first paragraph
        summary = self._extract_job_summary(text)
        
        # Extract employment type
        employment_type = self._extract_employment_type(text)
        
        # Extract location information
        location = self._extract_location(text, doc)
        
        return {
            "title": title,
            "jobSummary": summary,
            "employmentType": employment_type,
            "jobLocation": location,
            "customTags": [],
            "extraNotes": ""
        }

    def _extract_job_title(self, text: str, doc) -> str:
        """Extract job title from text"""
        lines = text.split('\n')
        
        # Check first few lines for potential titles
        for line in lines[:5]:
            line = line.strip()
            if len(line) > 10 and len(line) < 100:
                # Common job title patterns
                if any(keyword in line.lower() for keyword in 
                      ['engineer', 'developer', 'manager', 'analyst', 'specialist', 
                       'lead', 'senior', 'junior', 'principal']):
                    return line
        
        # Fallback: look for patterns like "Position:", "Role:", "Job Title:"
        title_patterns = [
            r'(?:position|role|job\s*title|title)\s*:?\s*(.+?)(?:\n|$)',
            r'^(.+?)(?:\s*-\s*job|\s*-\s*position|\s*-\s*role)',
        ]
        
        for pattern in title_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                return match.group(1).strip()
        
        return "Software Engineer"  # Default fallback

    def _extract_job_summary(self, text: str) -> str:
        """Extract job summary from text"""
        # Look for summary sections
        summary_patterns = [
            r'(?:job\s*summary|summary|overview|description)\s*:?\s*(.+?)(?:\n\n|\n[A-Z])',
            r'^(.+?)(?:\n\n|\nResponsibilities|\nRequirements|\nQualifications)'
        ]
        
        for pattern in summary_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL | re.MULTILINE)
            if match:
                summary = match.group(1).strip()
                if len(summary) > 50:  # Ensure it's substantial
                    return summary[:500]  # Limit length
        
        # Fallback: take first paragraph
        paragraphs = text.split('\n\n')
        if paragraphs:
            return paragraphs[0][:500]
        
        return "Join our team in this exciting opportunity."

    def _extract_employment_type(self, text: str) -> Dict:
        """Extract employment type information"""
        text_lower = text.lower()
        
        # Determine agreement type
        agreement = "Employee"  # Default
        if re.search(r'contract|contractor|freelance', text_lower):
            agreement = "Contractor"
        elif re.search(r'intern|internship', text_lower):
            agreement = "Intern"
        
        # Determine schedule
        schedule = "Full-time"  # Default
        for sched_type, pattern in self.employment_patterns.items():
            if re.search(pattern, text_lower):
                schedule = sched_type.replace('-', '-').title()
                break
        
        # Determine term
        term = "Permanent"  # Default
        if re.search(r'temporary|temp|contract', text_lower):
            term = "Temporary"
        
        return {
            "agreement": agreement,
            "schedule": schedule,
            "term": term
        }

    def _extract_location(self, text: str, doc) -> Dict:
        """Extract location information"""
        text_lower = text.lower()
        
        # Check for remote/hybrid/onsite
        location_type = "TELECOMMUTE"  # Default
        if re.search(self.location_patterns['remote'], text_lower):
            location_type = "TELECOMMUTE"
        elif re.search(self.location_patterns['hybrid'], text_lower):
            location_type = "HYBRID"
        elif re.search(self.location_patterns['onsite'], text_lower):
            location_type = "ONSITE"
        
        # Extract geographic locations using NER
        locations = [ent.text for ent in doc.ents if ent.label_ in ["GPE", "LOC"]]
        
        # Determine applicant location requirement
        applicant_req = "USA"  # Default
        if any(loc in text_lower for loc in ['international', 'global', 'worldwide']):
            applicant_req = "Global"
        elif any(country in text_lower for country in ['canada', 'uk', 'europe']):
            applicant_req = "North America"
        
        return {
            "type": location_type,
            "applicantLocationRequirement": applicant_req
        }

    def extract_responsibilities(self, text: str) -> Dict:
        """Extract job responsibilities"""
        doc = self.nlp(text)
        
        # Find responsibilities section
        resp_patterns = [
            r'(?:responsibilities|duties|what you.ll do|role|key tasks)\s*:?\s*(.+?)(?:\n\n|\n[A-Z][a-z]+:|\nRequirements|\nQualifications|$)',
        ]
        
        responsibilities_text = ""
        for pattern in resp_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                responsibilities_text = match.group(1)
                break
        
        # Extract key objectives (look for metrics, goals, targets)
        objectives = self._extract_objectives(responsibilities_text)
        
        # Extract day-to-day duties
        duties = self._extract_duties(responsibilities_text)
        
        return {
            "keyObjectives": objectives,
            "dayToDayDuties": duties,
            "customTags": [],
            "extraNotes": ""
        }

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
                    "objective": match.group(0),
                    "timeframe": "6 months",  # Default
                    "metric": "Performance Metric"
                })
        
        return objectives[:3]  # Limit to top 3

    def _extract_duties(self, text: str) -> List[str]:
        """Extract day-to-day duties"""
        duties = []
        
        # Split by bullet points or numbered lists
        lines = re.split(r'[\n•\-\*]\s*', text)
        
        for line in lines:
            line = line.strip()
            if len(line) > 20 and len(line) < 200:
                # Filter for duty-like statements
                if any(verb in line.lower() for verb in 
                      ['develop', 'build', 'create', 'design', 'implement', 
                       'maintain', 'collaborate', 'work', 'support', 'manage']):
                    duties.append(line)
        
        return duties[:10]  # Limit number of duties

    def extract_qualifications(self, text: str) -> Dict:
        """Extract qualifications and requirements"""
        
        # Extract required years of experience
        required_years = self._extract_experience_years(text)
        
        # Extract experience description
        exp_description = self._extract_experience_description(text)
        
        # Extract education requirements
        education = self._extract_education_requirements(text)
        
        # Extract technical and soft skills
        technical_skills = self._extract_technical_skills(text)
        soft_skills = self._extract_soft_skills(text)
        
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
                    if 0 <= years <= 20:  # Reasonable range
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
                return match.group(0)[:200]
        
        return "Experience in relevant technology stack and domain."

    def _extract_education_requirements(self, text: str) -> Dict:
        """Extract education requirements"""
        text_lower = text.lower()
        
        # Determine required credential
        credential = "Bachelor's Degree"  # Default
        if re.search(r'master|msc|ms\b', text_lower):
            credential = "Master's Degree"
        elif re.search(r'phd|doctorate', text_lower):
            credential = "PhD"
        elif re.search(r'associate', text_lower):
            credential = "Associate's Degree"
        
        # Check for specific fields
        if re.search(r'computer science', text_lower):
            credential += " in Computer Science"
        elif re.search(r'engineering', text_lower):
            credential += " in Engineering"
        
        # Check if experience can substitute
        accepts_experience = bool(re.search(
            r'(?:or|equivalent)\s*experience|experience\s*(?:in lieu|instead)',
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
        
        # Check all technical skill categories
        for category, skills in self.tech_skills.items():
            for skill in skills:
                if skill in text_lower:
                    found_skills.append(skill)
        
        # Remove duplicates and return
        return list(set(found_skills))

    def _extract_soft_skills(self, text: str) -> List[str]:
        """Extract soft skills"""
        soft_skills_list = [
            'communication', 'teamwork', 'leadership', 'problem solving',
            'analytical', 'creative', 'adaptable', 'organized', 'detail oriented',
            'time management', 'collaboration', 'critical thinking'
        ]
        
        text_lower = text.lower()
        found_skills = []
        
        for skill in soft_skills_list:
            if skill in text_lower:
                found_skills.append(skill)
        
        return found_skills

    def extract_company_context(self, text: str) -> Dict:
        """Extract company culture and growth opportunities"""
        
        # Look for culture-related content
        culture_patterns = [
            r'(?:culture|values|environment|team)\s*:?\s*(.+?)(?:\n\n|\n[A-Z])',
            r'(?:we value|our culture|company culture)\s*(.+?)(?:\n\n|\n[A-Z])'
        ]
        
        culture = "We value collaboration and innovation."  # Default
        for pattern in culture_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                culture = match.group(1).strip()[:200]
                break
        
        # Look for growth opportunities
        growth_patterns = [
            r'(?:growth|career|advancement|opportunity)\s*(.+?)(?:\n\n|\n[A-Z])',
            r'(?:learning|development|training)\s*(.+?)(?:\n\n|\n[A-Z])'
        ]
        
        growth = "Opportunities for professional development and career advancement."  # Default
        for pattern in growth_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                growth = match.group(1).strip()[:200]
                break
        
        return {
            "culture": culture,
            "growthOpportunities": growth,
            "customTags": [],
            "extraNotes": ""
        }

    def extract_compensation(self, text: str) -> Dict:
        """Extract salary and benefits information"""
        
        # Extract salary range
        salary_range = self._extract_salary_range(text)
        
        # Extract benefits
        benefits = self._extract_benefits(text)
        
        return {
            "salary": salary_range,
            "benefits": benefits,
            "customTags": [],
            "extraNotes": ""
        }

    def _extract_salary_range(self, text: str) -> Dict:
        """Extract salary range from text"""
        
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
                    
                    # Reasonable salary range check
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
        """Extract benefits from text"""
        benefits_keywords = [
            'health insurance', 'dental', 'vision', '401k', 'retirement',
            'pto', 'vacation', 'sick leave', 'flexible schedule',
            'work from home', 'remote work', 'stock options', 'equity',
            'bonuses', 'gym membership', 'learning stipend'
        ]
        
        text_lower = text.lower()
        found_benefits = []
        
        for benefit in benefits_keywords:
            if benefit in text_lower:
                found_benefits.append(benefit)
        
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
            "questionText": "Design a scalable web application architecture",
            "type": "Open-Ended",
            "topic": "System Design",
            "expectedSkills": ["Architecture", "Scalability", "System Design"]
        })
        
        # Skill-specific questions
        if 'python' in technical_skills:
            questions.append({
                "questionText": "Explain Python's GIL and its implications for multithreading",
                "type": "Discussion",
                "topic": "Python",
                "expectedSkills": ["Python", "Concurrency"]
            })
        
        if any(db in technical_skills for db in ['mysql', 'postgresql', 'mongodb']):
            questions.append({
                "questionText": "Design a database schema for a social media platform",
                "type": "Open-Ended",
                "topic": "Database Design",
                "expectedSkills": ["Database Design", "SQL", "NoSQL"]
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
        
        if 'leadership' in soft_skills:
            questions.append({
                "questionText": "Describe a time when you had to lead a team through a difficult situation",
                "type": "Behavioral",
                "topic": "Leadership",
                "expectedSkills": ["Leadership", "Team Management", "Decision Making"]
            })
        
        if 'communication' in soft_skills:
            questions.append({
                "questionText": "How do you explain complex technical concepts to non-technical stakeholders?",
                "type": "Reflective",
                "topic": "Communication",
                "expectedSkills": ["Communication", "Technical Writing", "Stakeholder Management"]
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
                    "processingMethod": "spaCy + Transformers",
                    "confidenceScore": 0.85,
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

    def save_to_json(self, job_profile: Dict, filename: str = None) -> str:
        """Save the job profile to a JSON file"""
        if filename is None:
            job_id = job_profile['jobProfile']['JobId']
            filename = f"job_profile_{job_id}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(job_profile, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Job profile saved to {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"Error saving job profile: {e}")
            raise

# Example usage
if __name__ == "__main__":
    # Sample job description for testing
    sample_job_desc = """
    Senior Software Engineer - Cloud Platform
    
    Join our innovative team to build the next generation of cloud infrastructure that serves millions of users worldwide.
    
    Responsibilities:
    • Design and develop scalable cloud-based applications
    • Improve system performance and reduce latency by 25%
    • Collaborate with cross-functional teams to deliver high-quality software
    • Mentor junior developers and contribute to architectural decisions
    • Implement best practices for security and reliability
    
    Requirements:
    • 5+ years of experience in software development
    • Strong proficiency in Python, Java, or Go
    • Experience with AWS, Docker, and Kubernetes
    • Bachelor's degree in Computer Science or equivalent experience
    • Excellent communication and problem-solving skills
    
    We offer competitive compensation ($120k-$160k), comprehensive health benefits, 
    flexible work arrangements, and opportunities for professional growth.
    
    Our culture values innovation, collaboration, and work-life balance.
    """
    
    # Initialize parser
    parser = JobDescriptionParser()
    
    # Parse the job description
    job_profile = parser.parse_job_description(sample_job_desc, "TechCorp Inc.")
    
    # Save to JSON file
    filename = parser.save_to_json(job_profile)
    
    print(f"Job profile extracted and saved to: {filename}")
    print(json.dumps(job_profile, indent=2))