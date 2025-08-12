import json
import re
import os
from typing import Dict, Any, Optional, List
import requests
import logging
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IntelligentJobDescriptionParser:
    def __init__(self, llama_api_url: str = "http://localhost:11434/api/generate"):
        """
        Intelligent job description parser that maps content to specific JSON template fields
        
        Args:
            llama_api_url: URL for the Llama3 API endpoint
        """
        self.llama_api_url = llama_api_url
        self.model_name = "llama3"
        
        # Initialize Supabase connection
        self.supabase_client = self._initialize_supabase()
        
        # Template field mapping configuration
        self.field_mappings = self._initialize_field_mappings()
    
    def _initialize_supabase(self) -> Optional[Client]:
        """Initialize Supabase client"""
        try:
            supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
            
            if not supabase_url:
                logger.error("SUPABASE_URL environment variable not set")
                raise Exception("Missing required environment variable: SUPABASE_URL")
            
            if not supabase_key:
                logger.error("SUPABASE_SERVICE_ROLE_KEY environment variable not set")
                raise Exception("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY")
            
            client = create_client(supabase_url, supabase_key)
            logger.info("Supabase client initialized successfully")
            return client
            
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    
    def _initialize_field_mappings(self) -> Dict[str, Dict[str, Any]]:
        """Initialize field mappings that define what to extract for each JSON template field"""
        return {
            "jobProfile.JobId": {
                "description": "Unique identifier for the job",
                "extraction_method": "template_id",
                "default": "OPEN"
            },
            "jobProfile.coreDetails.title": {
                "description": "Job title or position name",
                "keywords": ["title", "position", "role", "job"],
                "extraction_method": "title_extraction",
                "default": "OPEN"
            },
            "jobProfile.coreDetails.jobSummary": {
                "description": "Brief summary or overview of the job role",
                "keywords": ["summary", "overview", "about", "description", "we are looking for"],
                "extraction_method": "summary_extraction",
                "default": "OPEN"
            },
            "jobProfile.coreDetails.employmentType.agreement": {
                "description": "Employment agreement type",
                "keywords": ["employee", "contractor", "freelance", "consultant"],
                "extraction_method": "employment_type_extraction",
                "default": "OPEN"
            },
            "jobProfile.coreDetails.employmentType.schedule": {
                "description": "Work schedule type",
                "keywords": ["full-time", "part-time", "full time", "part time"],
                "extraction_method": "schedule_extraction",
                "default": "OPEN"
            },
            "jobProfile.coreDetails.employmentType.term": {
                "description": "Employment term duration",
                "keywords": ["permanent", "temporary", "contract", "fixed-term"],
                "extraction_method": "term_extraction",
                "default": "OPEN"
            },
            "jobProfile.coreDetails.jobLocation.type": {
                "description": "Work location type",
                "keywords": ["remote", "onsite", "hybrid", "telecommute", "work from home"],
                "extraction_method": "location_type_extraction",
                "default": "OPEN"
            },
            "jobProfile.coreDetails.jobLocation.applicantLocationRequirement": {
                "description": "Geographic requirements for applicants",
                "keywords": ["location", "based", "residents", "citizens", "timezone"],
                "extraction_method": "location_requirement_extraction",
                "default": "OPEN"
            },
            "jobProfile.responsibilities.dayToDayDuties": {
                "description": "Daily tasks and responsibilities",
                "keywords": ["responsibilities", "duties", "tasks", "will", "responsible for"],
                "extraction_method": "duties_extraction",
                "default": []
            },
            "jobProfile.responsibilities.keyObjectives": {
                "description": "Key goals and objectives",
                "keywords": ["objectives", "goals", "targets", "achieve", "deliver"],
                "extraction_method": "objectives_extraction",
                "default": []
            },
            "jobProfile.qualifications.skills.technical": {
                "description": "Required technical skills and technologies",
                "keywords": ["skills", "technologies", "programming", "software", "tools", "experience with"],
                "extraction_method": "technical_skills_extraction",
                "default": []
            },
            "jobProfile.qualifications.skills.soft": {
                "description": "Required soft skills and personal qualities",
                "keywords": ["communication", "teamwork", "leadership", "problem-solving", "analytical"],
                "extraction_method": "soft_skills_extraction",
                "default": []
            },
            "jobProfile.qualifications.experience.requiredYears": {
                "description": "Years of experience required",
                "keywords": ["years", "experience", "minimum", "at least"],
                "extraction_method": "experience_years_extraction",
                "default": 0
            },
            "jobProfile.qualifications.experience.description": {
                "description": "Description of required experience",
                "keywords": ["experience", "background", "proven track record"],
                "extraction_method": "experience_description_extraction",
                "default": "OPEN"
            },
            "jobProfile.qualifications.education.requiredCredential": {
                "description": "Required education credentials",
                "keywords": ["degree", "education", "bachelor", "master", "phd", "certification"],
                "extraction_method": "education_extraction",
                "default": "OPEN"
            },
            "jobProfile.qualifications.education.acceptsExperienceInLieu": {
                "description": "Whether experience can substitute for education",
                "keywords": ["equivalent experience", "in lieu", "substitute", "or equivalent"],
                "extraction_method": "experience_lieu_extraction",
                "default": False
            },
            "jobProfile.companyContext.culture": {
                "description": "Company culture and values",
                "keywords": ["culture", "values", "environment", "team", "we believe"],
                "extraction_method": "culture_extraction",
                "default": "OPEN"
            },
            "jobProfile.companyContext.growthOpportunities": {
                "description": "Career growth and development opportunities",
                "keywords": ["growth", "career", "development", "advancement", "opportunities"],
                "extraction_method": "growth_extraction",
                "default": "OPEN"
            },
            "jobProfile.compensation.salary.min": {
                "description": "Minimum salary amount",
                "keywords": ["salary", "compensation", "pay", "from", "starting"],
                "extraction_method": "salary_min_extraction",
                "default": 0
            },
            "jobProfile.compensation.salary.max": {
                "description": "Maximum salary amount",
                "keywords": ["salary", "compensation", "pay", "to", "up to"],
                "extraction_method": "salary_max_extraction",
                "default": 0
            },
            "jobProfile.compensation.salary.currency": {
                "description": "Salary currency",
                "keywords": ["usd", "eur", "gbp", "dollar", "euro", "pound"],
                "extraction_method": "currency_extraction",
                "default": "USD"
            },
            "jobProfile.compensation.benefits": {
                "description": "Employee benefits and perks",
                "keywords": ["benefits", "perks", "insurance", "vacation", "pto", "401k"],
                "extraction_method": "benefits_extraction",
                "default": []
            }
        }
    
    def test_llama_connection(self) -> bool:
        """Test if Llama3 API is accessible"""
        try:
            test_payload = {
                "model": self.model_name,
                "prompt": "Hello",
                "stream": False,
                "options": {"max_tokens": 10}
            }
            response = requests.post(self.llama_api_url, json=test_payload, timeout=10)
            return response.status_code == 200
        except:
            return False
    
    def test_supabase_connection(self) -> bool:
        """Test Supabase connection"""
        if not self.supabase_client:
            return False
        try:
            result = self.supabase_client.table("job_templates").select("template_id").limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase connection test failed: {e}")
            return False
    
    def load_json_template(self, template_path: str) -> Dict[str, Any]:
        """Load the JSON template file"""
        try:
            with open(template_path, 'r', encoding='utf-8') as file:
                return json.load(file)
        except FileNotFoundError:
            logger.error(f"Template file not found: {template_path}")
            raise
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in template file: {template_path}")
            raise
    
    def call_llama3(self, prompt: str) -> str:
        """Call Llama3 model with the given prompt"""
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "top_p": 0.9,
                "max_tokens": 3000
            }
        }
        
        try:
            response = requests.post(self.llama_api_url, json=payload, timeout=120)
            response.raise_for_status()
            return response.json().get("response", "")
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Llama3 API: {e}")
            return ""
    
    def extract_field_specific_info(self, job_description: str, field_path: str, field_config: Dict[str, Any]) -> str:
        """Extract information for a specific field using targeted prompts"""
        
        field_description = field_config.get("description", "")
        keywords = field_config.get("keywords", [])
        
        # Create field-specific prompts for better extraction
        if "title" in field_path:
            prompt = f"""
From this job description, extract ONLY the job title/position name:

{job_description}

Look for the job title at the beginning or in headers. Return only the exact title, nothing else.
If no clear title is found, return: OPEN
"""
        elif "jobSummary" in field_path:
            prompt = f"""
From this job description, extract a brief summary of what the job involves:

{job_description}

Extract the key points about what the role entails. Keep it concise and focused.
Combine related information into 1-2 sentences maximum.
If no clear summary can be extracted, return: OPEN
"""
        elif "technical" in field_path:
            prompt = f"""
From this job description, extract technical skills, technologies, or programming requirements:

{job_description}

Look for:
- Programming languages (Python, Java, JavaScript, etc.)
- Technologies and frameworks 
- Software tools
- Technical skills or experience mentioned (including "programming experience")
- Any coding or development requirements
- Technical qualifications

List each skill separated by "|" character. Include experience levels if mentioned.
If no technical skills are found, return: OPEN
"""
        elif "soft" in field_path:
            prompt = f"""
From this job description, extract soft skills or personal qualities required:

{job_description}

Look for:
- Communication skills
- Teamwork, collaboration
- Leadership abilities  
- Problem-solving skills
- Interpersonal skills
- Work ethic qualities
- Personal attributes mentioned

List each skill separated by "|" character.
If no soft skills are found, return: OPEN
"""
        elif "duties" in field_path:
            prompt = f"""
From this job description, extract specific daily tasks, duties, or responsibilities:

{job_description}

Look for what the person will do day-to-day. List each duty separated by "|" character.
If no specific duties are found, return: OPEN
"""
        elif "experience" in field_path and "description" in field_path:
            prompt = f"""
From this job description, extract experience requirements:

{job_description}

Look for required experience, background, or qualifications mentioned.
If no experience requirements are found, return: OPEN
"""
        elif "salary" in field_path:
            prompt = f"""
From this job description, extract salary or compensation information:

{job_description}

Look for salary ranges, pay rates, compensation mentioned.
If no salary information is found, return: OPEN
"""
        else:
            # Generic prompt for other fields
            prompt = f"""
From this job description, extract information for: {field_description}

{job_description}

Keywords to look for: {', '.join(keywords)}

Extract only the relevant information. If nothing relevant is found, return: OPEN
"""
        
        response = self.call_llama3(prompt)
        return self.clean_response(response, field_path) if response.strip() else "OPEN"
    
    def clean_response(self, response: str, field_path: str) -> str:
        """Clean AI response to extract only the essential information"""
        if not response or response.strip() == "":
            return "OPEN"
        
        response = response.strip()
        
        # Remove "OPEN" explanations more aggressively
        if "OPEN" in response.upper():
            # If response contains OPEN with explanation, just return OPEN
            if len(response) > 10:  # If it's longer than just "OPEN", it probably has explanation
                return "OPEN"
        
        # Check if the response is just a field description (common problem)
        field_descriptions = [
            "Job title or position name",
            "Brief summary or overview of the job role", 
            "Work schedule type",
            "Daily tasks and responsibilities",
            "Required technical skills and technologies",
            "Required soft skills and personal qualities",
            "Description of required experience",
            "Required education credentials"
        ]
        
        if response in field_descriptions:
            return "OPEN"
        
        # Remove common AI response patterns and explanatory text - be more aggressive
        response = re.sub(r'^.*?extract.*?:\s*', '', response, flags=re.IGNORECASE)
        response = re.sub(r'^.*?from.*?job description.*?:\s*', '', response, flags=re.IGNORECASE)
        response = re.sub(r'^.*?the following.*?:\s*', '', response, flags=re.IGNORECASE)
        response = re.sub(r'^.*?here is.*?:\s*', '', response, flags=re.IGNORECASE)
        response = re.sub(r'^.*?based on.*?:\s*', '', response, flags=re.IGNORECASE)
        
        # Remove field references and descriptions
        response = re.sub(r'^.*?title.*?:\s*', '', response, flags=re.IGNORECASE)
        response = re.sub(r'^.*?summary.*?:\s*', '', response, flags=re.IGNORECASE)
        response = re.sub(r'^.*?skills.*?:\s*', '', response, flags=re.IGNORECASE)
        
        # Extract quoted content if present
        quoted_match = re.search(r'"([^"]+)"', response)
        if quoted_match:
            response = quoted_match.group(1)
        
        # Remove any remaining explanatory text
        response = re.sub(r'\s*\(.*?\)', '', response)  # Remove parenthetical explanations
        response = re.sub(r'\s*-.*?(mentioned|found|listed).*$', '', response, flags=re.IGNORECASE)
        response = re.sub(r'\s*this.*?(matches|meets|is).*$', '', response, flags=re.IGNORECASE)
        response = re.sub(r'\s*combining.*?sentences.*?:', '', response, flags=re.IGNORECASE)
        response = re.sub(r'\s*no other information.*$', '', response, flags=re.IGNORECASE)
        response = re.sub(r'\s*so this.*?covers.*$', '', response, flags=re.IGNORECASE)
        
        # For job summaries, keep only the core description
        if "jobSummary" in field_path:
            # Find the actual job description sentences
            sentences = response.split('.')
            clean_sentences = []
            for sentence in sentences:
                sentence = sentence.strip()
                if sentence and not any(skip in sentence.lower() for skip in 
                    ['combining', 'relevant', 'covers', 'aspects', 'information', 'provided']):
                    clean_sentences.append(sentence)
            if clean_sentences:
                response = '. '.join(clean_sentences[:2])  # Max 2 sentences
                if not response.endswith('.'):
                    response += '.'
        
        # Clean up punctuation and formatting
        response = re.sub(r'^[-•*]\s*', '', response)  # Remove bullet points
        response = re.sub(r'\s*[.!?]+$', '', response)  # Remove trailing punctuation
        
        # Clean up newlines and extra spaces
        response = re.sub(r'\n+', ' ', response)
        response = re.sub(r'\s+', ' ', response)
        
        response = response.strip()
        
        # If response is empty after cleaning, return OPEN
        if not response or response.lower() in ['n/a', 'not mentioned', 'not specified', 'not available', 'none']:
            return "OPEN"
        
        # Final check for field descriptions that might have gotten through
        if response in field_descriptions:
            return "OPEN"
        
        return response
    
    def parse_extracted_value(self, raw_value: str, field_path: str, default_value: Any) -> Any:
        """Parse the extracted value based on the field type and path"""
        
        if raw_value == "OPEN" or not raw_value:
            return default_value
        
        # Handle different field types
        if "requiredYears" in field_path:
            # Extract numeric years
            years_match = re.search(r'(\d+)', raw_value)
            return int(years_match.group(1)) if years_match else 0
        
        elif "acceptsExperienceInLieu" in field_path:
            # Boolean field
            return "true" in raw_value.lower() or "yes" in raw_value.lower() or "equivalent" in raw_value.lower()
        
        elif "salary" in field_path and ("min" in field_path or "max" in field_path):
            # Extract salary numbers
            salary_match = re.search(r'[\$]?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', raw_value.replace(',', ''))
            return int(float(salary_match.group(1).replace(',', ''))) if salary_match else 0
        
        elif field_path.endswith(("duties", "benefits", "technical", "soft")):
            # List fields - extract clean values
            if "|" in raw_value:
                items = [item.strip() for item in raw_value.split("|") if item.strip()]
            else:
                items = [raw_value] if raw_value != "OPEN" else []
            
            # Clean each item in the list
            cleaned_items = []
            for item in items:
                # Remove field references and explanatory text
                item = re.sub(r'^.*?=\s*["\']?', '', item)
                item = re.sub(r'["\']?\s*$', '', item)
                item = item.strip('\'"')
                if item and item != "OPEN":
                    cleaned_items.append(item)
            
            return cleaned_items
        
        elif "keyObjectives" in field_path:
            # Special handling for objectives
            if "|" in raw_value:
                objectives = raw_value.split("|")
                return [{"objective": obj.strip(), "timeframe": "OPEN", "metric": "OPEN"} for obj in objectives if obj.strip()]
            elif raw_value != "OPEN":
                return [{"objective": raw_value, "timeframe": "OPEN", "metric": "OPEN"}]
            else:
                return []
        
        else:
            # String fields
            return raw_value if raw_value != "OPEN" else default_value
    
    def set_nested_value(self, data: Dict[str, Any], path: str, value: Any):
        """Set a value in a nested dictionary using dot notation path"""
        keys = path.split('.')
        current = data
        
        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]
        
        current[keys[-1]] = value
    
    def get_nested_value(self, data: Dict[str, Any], path: str) -> Any:
        """Get a value from a nested dictionary using dot notation path"""
        keys = path.split('.')
        current = data
        
        try:
            for key in keys:
                current = current[key]
            return current
        except (KeyError, TypeError):
            return None
    
    def intelligently_fill_template(self, template: Dict[str, Any], job_description: str, template_id: str) -> Dict[str, Any]:
        """Intelligently fill the template by extracting field-specific information while preserving ALL template structure"""
        
        # Create a deep copy to preserve the original template structure
        filled_template = json.loads(json.dumps(template))  
        
        # Set the template ID
        filled_template["jobProfile"]["JobId"] = template_id
        
        logger.info("Starting intelligent field extraction...")
        
        # FIRST: Ensure ALL template fields are preserved by filling unmapped fields with "OPEN" or default values
        self._ensure_complete_template_structure(filled_template)
        
        # SECOND: Process each field mapping to extract actual content
        for field_path, field_config in self.field_mappings.items():
            if field_path == "jobProfile.JobId":
                continue  # Already set
            
            logger.info(f"Extracting information for: {field_path}")
            
            # Extract field-specific information
            raw_value = self.extract_field_specific_info(job_description, field_path, field_config)
            
            # Parse and convert the value
            parsed_value = self.parse_extracted_value(raw_value, field_path, field_config["default"])
            
            # Only update if we have a valid non-default value or if the field doesn't exist
            current_value = self.get_nested_value(filled_template, field_path)
            if current_value is None or (parsed_value != field_config["default"] and parsed_value != "OPEN"):
                self.set_nested_value(filled_template, field_path, parsed_value)
            elif parsed_value == "OPEN" and field_config["default"] != "OPEN":
                # Use the default value instead of OPEN for fields that have meaningful defaults
                self.set_nested_value(filled_template, field_path, field_config["default"])
            
            logger.info(f"  {field_path}: {parsed_value}")
        
        # THIRD: Handle special template fields that aren't in mappings
        self._fill_special_template_fields(filled_template)
        
        # Update metadata
        filled_template["jobProfile"]["meta"]["lastUpdated"] = str(int(datetime.now().timestamp()))
        filled_template["jobProfile"]["meta"]["source"] = "AI-Extracted"
        filled_template["jobProfile"]["meta"]["schemaVersion"] = "v1.1"
        
        return filled_template
    
    def _ensure_complete_template_structure(self, template: Dict[str, Any]):
        """Ensure ALL fields from the original template are preserved with appropriate default values"""
        
        def fill_template_recursively(obj, default_string="OPEN", default_array=None, default_number=0):
            """Recursively fill template with default values while preserving structure"""
            if default_array is None:
                default_array = []
                
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if isinstance(value, dict):
                        fill_template_recursively(value, default_string, default_array, default_number)
                    elif isinstance(value, list):
                        if not value:  # Empty list
                            obj[key] = []
                        else:
                            # If list has items, process each item
                            for item in value:
                                if isinstance(item, dict):
                                    fill_template_recursively(item, default_string, default_array, default_number)
                    elif isinstance(value, str) and value == "":
                        obj[key] = default_string
                    elif isinstance(value, (int, float)) and value == 0 and key != "requiredYears":
                        # Keep 0 for requiredYears but set others that should have meaningful defaults
                        if key in ["min", "max"] and "salary" in str(obj):
                            obj[key] = 0  # Keep salary defaults as 0
                        elif key == "durationMinutes":
                            obj[key] = 0  # Keep duration as 0
                        else:
                            obj[key] = default_number
            
            elif isinstance(obj, list):
                for item in obj:
                    if isinstance(item, dict):
                        fill_template_recursively(item, default_string, default_array, default_number)
        
        # Apply recursive filling to ensure all fields have appropriate defaults
        fill_template_recursively(template)
    
    def _fill_special_template_fields(self, template: Dict[str, Any]):
        """Fill special template fields that need default values"""
        
        # Ensure all customTags are empty arrays
        custom_tag_paths = [
            "jobProfile.coreDetails.customTags",
            "jobProfile.responsibilities.customTags", 
            "jobProfile.qualifications.customTags",
            "jobProfile.companyContext.customTags",
            "jobProfile.compensation.customTags",
            "jobProfile.interviewGuidance.customTags"
        ]
        
        for path in custom_tag_paths:
            self.set_nested_value(template, path, [])
        
        # Ensure all extraNotes are "OPEN"
        extra_notes_paths = [
            "jobProfile.coreDetails.extraNotes",
            "jobProfile.responsibilities.extraNotes",
            "jobProfile.qualifications.extraNotes", 
            "jobProfile.companyContext.extraNotes",
            "jobProfile.compensation.extraNotes",
            "jobProfile.interviewGuidance.extraNotes"
        ]
        
        for path in extra_notes_paths:
            self.set_nested_value(template, path, "OPEN")
        
        # Set default interview flow and assessment plan
        self.set_nested_value(template, "jobProfile.interviewGuidance.assessmentPlan", [])
        self.set_nested_value(template, "jobProfile.interviewGuidance.competencyProfile", [])
        
        # Keep the existing interview flow structure but mark as OPEN
        interview_flow = self.get_nested_value(template, "jobProfile.interviewGuidance.interviewFlow")
        if interview_flow:
            for stage in interview_flow:
                for key in stage.keys():
                    if isinstance(stage[key], str):
                        stage[key] = "OPEN"
                    elif isinstance(stage[key], int):
                        stage[key] = 0
                    elif isinstance(stage[key], list) and key == "evaluators":
                        stage[key] = ["OPEN"]
                    elif isinstance(stage[key], list) and key == "questions":
                        for question in stage[key]:
                            for q_key in question.keys():
                                if isinstance(question[q_key], str):
                                    question[q_key] = "OPEN"
                                elif isinstance(question[q_key], list):
                                    question[q_key] = ["OPEN"]
        
        # Set custom fields in meta
        self.set_nested_value(template, "jobProfile.meta.customFields.hardwareRequirement", "OPEN")
        self.set_nested_value(template, "jobProfile.meta.customFields.timezoneOverlap", "OPEN")
        self.set_nested_value(template, "jobProfile.meta.customFields.clearance", "OPEN")
    
    def get_job_description_from_db(self, template_id: str = None) -> tuple[str, str, str, str]:
        """Get job description from Supabase database"""
        if not self.supabase_client:
            raise Exception("Supabase client not initialized")
        
        try:
            if template_id:
                result = self.supabase_client.table("job_templates").select("template_id, user_job_description, template_name, job_role").eq("template_id", template_id).execute()
            else:
                result = self.supabase_client.table("job_templates").select("template_id, user_job_description, template_name, job_role").is_("initial_json_schema", "null").eq("is_active", True).order("created_at", desc=True).limit(1).execute()
            
            if not result.data:
                raise Exception("No job description found in database")
            
            job_data = result.data[0]
            return job_data["user_job_description"], job_data["template_id"], job_data.get("template_name", ""), job_data.get("job_role", "")
            
        except Exception as e:
            logger.error(f"Error fetching job description from database: {e}")
            raise
    
    def save_initial_json_to_db(self, template_id: str, initial_json: Dict[str, Any]):
        """Save the filled JSON template to initial_json_schema column"""
        if not self.supabase_client:
            raise Exception("Supabase client not initialized")
        
        try:
            # Verify the template_id exists first
            check_result = self.supabase_client.table("job_templates").select("template_id").eq("template_id", template_id).execute()
            if not check_result.data:
                raise Exception(f"Template ID {template_id} not found in database")
            
            # Update the initial_json_schema column
            result = self.supabase_client.table("job_templates").update({
                "initial_json_schema": initial_json
            }).eq("template_id", template_id).execute()
            
            # Verify the update was successful
            if result.data:
                logger.info(f"✓ Successfully updated initial_json_schema for template ID: {template_id}")
                return result.data
            else:
                raise Exception("Update operation returned no data - may have failed")
            
        except Exception as e:
            logger.error(f"Error saving filled JSON to database: {e}")
            raise
    
    def verify_database_update(self, template_id: str) -> bool:
        """Verify that the database was actually updated with the JSON schema"""
        if not self.supabase_client:
            return False
            
        try:
            result = self.supabase_client.table("job_templates").select("initial_json_schema").eq("template_id", template_id).execute()
            
            if result.data and result.data[0]["initial_json_schema"] is not None:
                logger.info(f"✓ Database verification successful - initial_json_schema is populated for template {template_id}")
                return True
            else:
                logger.warning(f"⚠ Database verification failed - initial_json_schema is still null for template {template_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error verifying database update: {e}")
            return False
    
    def save_filled_template(self, filled_template: Dict[str, Any], output_path: str):
        """Save the filled template to a JSON file"""
        try:
            with open(output_path, 'w', encoding='utf-8') as file:
                json.dump(filled_template, file, indent=2, ensure_ascii=False)
            logger.info(f"Filled template saved to: {output_path}")
        except Exception as e:
            logger.error(f"Error saving filled template: {e}")
            raise
    
    def process_job_description_intelligently(self, template_id: str = None, template_path: str = None, save_local: bool = True) -> Dict[str, Any]:
        """Main method to intelligently process job description from database"""
        try:
            # Test connections
            if not self.test_supabase_connection():
                raise Exception("Cannot connect to Supabase database")
            
            # Get job description from database
            logger.info("Fetching job description from database...")
            job_description, db_template_id, template_name, job_role = self.get_job_description_from_db(template_id)
            
            print(f"Processing Job Intelligently:")
            print(f"  Template ID: {db_template_id}")
            print(f"  Template Name: {template_name}")
            print(f"  Job Role: {job_role}")
            print(f"  Job Description Length: {len(job_description)} characters")
            print(f"  Job Description Content: {job_description[:200]}...")  # Show first 200 chars
            
            # Load template from local machine
            if not template_path:
                try:
                    script_dir = os.path.dirname(os.path.abspath(__file__))
                except NameError:
                    # Handle case when __file__ is not defined (e.g., when running via exec)
                    script_dir = os.getcwd()
                template_path = os.path.join(script_dir, "JSON_Template", "json_template.json")
            
            logger.info(f"Loading JSON template from: {template_path}")
            template = self.load_json_template(template_path)
            
            # Intelligently fill the template
            logger.info("Starting intelligent template filling...")
            filled_template = self.intelligently_fill_template(template, job_description, db_template_id)
            
            # Save filled template to initial_json_schema column
            logger.info("Saving intelligently filled JSON to initial_json_schema column...")
            self.save_initial_json_to_db(db_template_id, filled_template)
            
            # Verify the database update was successful
            if self.verify_database_update(db_template_id):
                print(f"✓ Database successfully updated for template {db_template_id}")
            else:
                print(f"⚠ Warning: Database update verification failed for template {db_template_id}")
            
            # Optionally save local backup
            if save_local:
                try:
                    script_dir = os.path.dirname(os.path.abspath(__file__))
                except NameError:
                    # Handle case when __file__ is not defined (e.g., when running via exec)
                    script_dir = os.getcwd()
                output_dir = os.path.join(script_dir, "Output")
                os.makedirs(output_dir, exist_ok=True)
                
                output_filename = f"{db_template_id}_intelligent.json"
                output_path = os.path.join(output_dir, output_filename)
                self.save_filled_template(filled_template, output_path)
            
            return filled_template
            
        except Exception as e:
            logger.error(f"Error in intelligent processing: {e}")
            raise

def process_single_job_intelligently(template_id: str = None):
    """Process a single job using intelligent extraction"""
    parser = IntelligentJobDescriptionParser()
    
    try:
        print("=== Intelligent Job Description Parser ===")
        print("Testing connections...")
        
        # Test Llama3 connection
        if not parser.test_llama_connection():
            print("Warning: Cannot connect to Llama3 API at http://localhost:11434")
            print("Make sure Ollama is running: 'ollama serve'")
            print("And Llama3 is installed: 'ollama pull llama3'")
            print("Proceeding with 'OPEN' values for missing fields...\n")
        else:
            print("✓ Llama3 connection successful")
        
        # Test Supabase connection
        if not parser.test_supabase_connection():
            print("✗ Cannot connect to Supabase database")
            return
        else:
            print("✓ Supabase connection successful")
        
        # Process the job description intelligently
        print(f"\nProcessing with intelligent extraction...")
        result = parser.process_job_description_intelligently(template_id)
        
        print("\n=== Intelligent Processing Complete ===")
        print(f"Template ID: {result.get('jobProfile', {}).get('JobId', 'N/A')}")
        print(f"Job Title: {result.get('jobProfile', {}).get('coreDetails', {}).get('title', 'N/A')}")
        print("Intelligently filled JSON saved to initial_json_schema column!")
        print("All unmapped fields marked as 'OPEN'")
        
    except Exception as e:
        print(f"Error: {e}")

def process_all_pending_jobs_intelligently():
    """Process all pending jobs using intelligent extraction"""
    parser = IntelligentJobDescriptionParser()
    
    if not parser.supabase_client:
        print("Error: Cannot initialize Supabase client")
        return
    
    try:
        # Get all unprocessed jobs
        result = parser.supabase_client.table("job_templates").select("template_id, user_job_description, template_name, job_role").is_("initial_json_schema", "null").eq("is_active", True).execute()
        
        if not result.data:
            print("No pending jobs found in database")
            return
        
        print(f"Found {len(result.data)} pending jobs to process intelligently")
        
        for job_data in result.data:
            template_id = job_data["template_id"]
            template_name = job_data.get("template_name", "Unknown")
            job_role = job_data.get("job_role", "Unknown")
            print(f"\nProcessing template ID: {template_id}")
            print(f"Template Name: {template_name}")
            print(f"Job Role: {job_role}")
            
            try:
                parser.process_job_description_intelligently(template_id)
                print(f"✓ Successfully processed template ID: {template_id}")
            except Exception as e:
                print(f"✗ Failed to process template ID {template_id}: {e}")
                continue
        
        print("\n=== Intelligent Batch Processing Complete ===")
        
    except Exception as e:
        print(f"Error in intelligent batch processing: {e}")

def main():
    """Main function with intelligent processing options"""
    print("=== Intelligent Supabase Job Description Parser ===")
    print("1. Process specific job by Template ID (Intelligent)")
    print("2. Process latest unprocessed job (Intelligent)")
    print("3. Process all pending jobs (Intelligent)")
    print("4. Exit")
    
    choice = input("\nEnter your choice (1-4): ").strip()
    
    if choice == "1":
        template_id = input("Enter template ID (UUID): ").strip()
        if template_id:
            process_single_job_intelligently(template_id)
        else:
            print("Invalid template ID.")
    
    elif choice == "2":
        process_single_job_intelligently()
    
    elif choice == "3":
        process_all_pending_jobs_intelligently()
    
    elif choice == "4":
        print("Goodbye!")
        return
    
    else:
        print("Invalid choice. Please run the script again.")

if __name__ == "__main__":
    main()
