import json
import re
import os
from typing import Dict, Any, Optional
import requests
import logging
from datetime import datetime
from supabase import create_client, Client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupabaseJobDescriptionParser:
    def __init__(self, llama_api_url: str = "http://localhost:11434/api/generate"):
        """
        Initialize the job description parser with Llama3 model and Supabase
        
        Args:
            llama_api_url: URL for the Llama3 API endpoint (assumes Ollama is running locally)
        """
        self.llama_api_url = llama_api_url
        self.model_name = "llama3"
        
        # Initialize Supabase connection
        self.supabase_client = self._initialize_supabase()
    
    def _initialize_supabase(self) -> Optional[Client]:
        """Initialize Supabase client"""
        try:
            # Get Supabase credentials from environment variables
            supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
            
            # Fallback to hardcoded values if environment variables are not set
            if not supabase_url:
                supabase_url = "https://ibnsjeoemngngkqnnjdz.supabase.co"
                logger.warning("Using fallback Supabase URL")
            
            if not supabase_key:
                supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibnNqZW9lbW5nbmdrcW5uamR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcwOTgxMSwiZXhwIjoyMDY5Mjg1ODExfQ.9Qr2srBzKeVLkZcq1ZMv-B2-_mj71QyDTzdedgxSCSs"
                logger.warning("Using fallback Supabase key")
            
            client = create_client(supabase_url, supabase_key)
            logger.info("Supabase client initialized successfully")
            return client
            
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    
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
            # Test connection by querying the job_templates table
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
    
    def extract_job_info(self, job_description: str) -> str:
        """Extract job information using Llama3"""
        
        prompt = f"""
You are a job description analyzer. Please analyze the following job description and extract ALL relevant information in a structured format.

Job Description:
{job_description}

Please extract the following information and respond in this EXACT format:

JOB_TITLE: [extracted job title]
JOB_SUMMARY: [brief summary of the role]
EMPLOYMENT_TYPE: [Full-time/Part-time/Contract/etc.]
SCHEDULE: [Full-time/Part-time]
TERM: [Permanent/Temporary/Contract]
LOCATION_TYPE: [TELECOMMUTE/ONSITE/HYBRID]
LOCATION_REQUIREMENT: [geographic requirements]
KEY_OBJECTIVES: [main goals and objectives - separate multiple with |]
DAY_TO_DAY_DUTIES: [daily responsibilities - separate multiple with |]
TECHNICAL_SKILLS: [required technical skills - separate multiple with |]
SOFT_SKILLS: [required soft skills - separate multiple with |]
REQUIRED_YEARS: [years of experience required]
EXPERIENCE_DESCRIPTION: [description of required experience]
EDUCATION_REQUIRED: [education requirements]
ACCEPTS_EXPERIENCE_IN_LIEU: [true/false if experience can substitute education]
COMPANY_CULTURE: [company culture description]
GROWTH_OPPORTUNITIES: [career growth and development opportunities]
SALARY_MIN: [minimum salary if mentioned]
SALARY_MAX: [maximum salary if mentioned]
CURRENCY: [salary currency if mentioned]
BENEFITS: [benefits offered - separate multiple with |]
COMPETENCY_PROFILE: [key competencies to assess - separate multiple with |]
ASSESSMENT_PLAN: [assessment methods - separate multiple with |]

Rules:
- Extract only information that is explicitly mentioned or can be reasonably inferred
- If information is not available, respond with: FIELD_NAME: OPEN
- For numeric fields (salary, years), provide only the number
- For boolean fields, respond with true or false
- Be precise and extract complete information
- Separate multiple items with | character

Extract the information now:
"""
        
        return self.call_llama3(prompt)
    
    def parse_llama_response(self, llama_response: str) -> Dict[str, str]:
        """Parse the response from Llama3 into a dictionary"""
        extracted_data = {}
        
        # Split response into lines and process each
        lines = llama_response.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if ':' in line:
                # Split on first colon to handle cases where value contains colons
                field_name, value = line.split(':', 1)
                field_name = field_name.strip()
                value = value.strip()
                
                # Clean up the field name (remove any prefixes)
                field_name = re.sub(r'^(FIELD_NAME|Field|Key)\s*[-:]?\s*', '', field_name, flags=re.IGNORECASE)
                
                if value and value.lower() != 'open':
                    extracted_data[field_name] = value
                else:
                    extracted_data[field_name] = "OPEN"
        
        return extracted_data
    
    def fill_json_template(self, template: Dict[str, Any], extracted_data: Dict[str, str], template_id: str) -> Dict[str, Any]:
        """Fill the JSON template with extracted data"""
        filled_template = template.copy()
        
        # Use template_id as the JobId
        filled_template["jobProfile"]["JobId"] = template_id
        
        # Fill core details
        filled_template["jobProfile"]["coreDetails"]["title"] = extracted_data.get("JOB_TITLE", "OPEN")
        filled_template["jobProfile"]["coreDetails"]["jobSummary"] = extracted_data.get("JOB_SUMMARY", "OPEN")
        
        # Employment type
        filled_template["jobProfile"]["coreDetails"]["employmentType"]["agreement"] = extracted_data.get("EMPLOYMENT_TYPE", "OPEN")
        filled_template["jobProfile"]["coreDetails"]["employmentType"]["schedule"] = extracted_data.get("SCHEDULE", "OPEN")
        filled_template["jobProfile"]["coreDetails"]["employmentType"]["term"] = extracted_data.get("TERM", "OPEN")
        
        # Job location
        filled_template["jobProfile"]["coreDetails"]["jobLocation"]["type"] = extracted_data.get("LOCATION_TYPE", "OPEN")
        filled_template["jobProfile"]["coreDetails"]["jobLocation"]["applicantLocationRequirement"] = extracted_data.get("LOCATION_REQUIREMENT", "OPEN")
        
        # Key objectives
        if extracted_data.get("KEY_OBJECTIVES") and extracted_data["KEY_OBJECTIVES"] != "OPEN":
            objectives = extracted_data["KEY_OBJECTIVES"].split("|")
            filled_template["jobProfile"]["responsibilities"]["keyObjectives"] = [
                {
                    "objective": obj.strip(),
                    "timeframe": "OPEN",
                    "metric": "OPEN"
                } for obj in objectives if obj.strip()
            ]
        
        # Day to day duties
        if extracted_data.get("DAY_TO_DAY_DUTIES") and extracted_data["DAY_TO_DAY_DUTIES"] != "OPEN":
            duties = extracted_data["DAY_TO_DAY_DUTIES"].split("|")
            filled_template["jobProfile"]["responsibilities"]["dayToDayDuties"] = [duty.strip() for duty in duties if duty.strip()]
        
        # Skills
        if extracted_data.get("TECHNICAL_SKILLS") and extracted_data["TECHNICAL_SKILLS"] != "OPEN":
            tech_skills = extracted_data["TECHNICAL_SKILLS"].split("|")
            filled_template["jobProfile"]["qualifications"]["skills"]["technical"] = [skill.strip() for skill in tech_skills if skill.strip()]
        
        if extracted_data.get("SOFT_SKILLS") and extracted_data["SOFT_SKILLS"] != "OPEN":
            soft_skills = extracted_data["SOFT_SKILLS"].split("|")
            filled_template["jobProfile"]["qualifications"]["skills"]["soft"] = [skill.strip() for skill in soft_skills if skill.strip()]
        
        # Experience
        try:
            years_str = extracted_data.get("REQUIRED_YEARS", "0")
            # Handle cases like "5+" or "5-7" or "5 years"
            years_match = re.search(r'(\d+)', str(years_str))
            if years_match:
                years = int(years_match.group(1))
            else:
                years = 0
            filled_template["jobProfile"]["qualifications"]["experience"]["requiredYears"] = years
        except (ValueError, TypeError):
            filled_template["jobProfile"]["qualifications"]["experience"]["requiredYears"] = 0
        
        filled_template["jobProfile"]["qualifications"]["experience"]["description"] = extracted_data.get("EXPERIENCE_DESCRIPTION", "OPEN")
        
        # Education
        filled_template["jobProfile"]["qualifications"]["education"]["requiredCredential"] = extracted_data.get("EDUCATION_REQUIRED", "OPEN")
        accepts_exp = extracted_data.get("ACCEPTS_EXPERIENCE_IN_LIEU", "false").lower() == "true"
        filled_template["jobProfile"]["qualifications"]["education"]["acceptsExperienceInLieu"] = accepts_exp
        
        # Company context
        filled_template["jobProfile"]["companyContext"]["culture"] = extracted_data.get("COMPANY_CULTURE", "OPEN")
        filled_template["jobProfile"]["companyContext"]["growthOpportunities"] = extracted_data.get("GROWTH_OPPORTUNITIES", "OPEN")
        
        # Compensation
        try:
            min_salary = int(extracted_data.get("SALARY_MIN", 0))
            max_salary = int(extracted_data.get("SALARY_MAX", 0))
            filled_template["jobProfile"]["compensation"]["salary"]["min"] = min_salary
            filled_template["jobProfile"]["compensation"]["salary"]["max"] = max_salary
        except (ValueError, TypeError):
            filled_template["jobProfile"]["compensation"]["salary"]["min"] = 0
            filled_template["jobProfile"]["compensation"]["salary"]["max"] = 0
        
        filled_template["jobProfile"]["compensation"]["salary"]["currency"] = extracted_data.get("CURRENCY", "USD")
        
        if extracted_data.get("BENEFITS") and extracted_data["BENEFITS"] != "OPEN":
            benefits = extracted_data["BENEFITS"].split("|")
            filled_template["jobProfile"]["compensation"]["benefits"] = [benefit.strip() for benefit in benefits if benefit.strip()]
        
        # Interview guidance
        if extracted_data.get("COMPETENCY_PROFILE") and extracted_data["COMPETENCY_PROFILE"] != "OPEN":
            competencies = extracted_data["COMPETENCY_PROFILE"].split("|")
            filled_template["jobProfile"]["interviewGuidance"]["competencyProfile"] = [comp.strip() for comp in competencies if comp.strip()]
        
        if extracted_data.get("ASSESSMENT_PLAN") and extracted_data["ASSESSMENT_PLAN"] != "OPEN":
            assessments = extracted_data["ASSESSMENT_PLAN"].split("|")
            filled_template["jobProfile"]["interviewGuidance"]["assessmentPlan"] = [assess.strip() for assess in assessments if assess.strip()]
        
        # Update metadata
        filled_template["jobProfile"]["meta"]["lastUpdated"] = str(int(datetime.now().timestamp()))
        
        return filled_template
    
    def get_job_description_from_db(self, template_id: str = None) -> tuple[str, str, str, str]:
        """Get job description from Supabase database"""
        if not self.supabase_client:
            raise Exception("Supabase client not initialized")
        
        try:
            if template_id:
                # Get specific job by template_id
                result = self.supabase_client.table("job_templates").select("template_id, user_job_description, template_name, job_role").eq("template_id", template_id).execute()
            else:
                # Get the most recent unprocessed job (where initial_json_schema is null)
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
            result = self.supabase_client.table("job_templates").update({
                "initial_json_schema": initial_json
            }).eq("template_id", template_id).execute()
            
            logger.info(f"Filled JSON saved to initial_json_schema for template ID: {template_id}")
            return result.data
            
        except Exception as e:
            logger.error(f"Error saving filled JSON to database: {e}")
            raise
    
    def save_filled_template(self, filled_template: Dict[str, Any], output_path: str):
        """Save the filled template to a JSON file (backup/local copy)"""
        try:
            with open(output_path, 'w', encoding='utf-8') as file:
                json.dump(filled_template, file, indent=2, ensure_ascii=False)
            logger.info(f"Filled template saved to: {output_path}")
        except Exception as e:
            logger.error(f"Error saving filled template: {e}")
            raise
    
    def process_job_description_from_db(self, template_id: str = None, template_path: str = None, save_local: bool = True) -> Dict[str, Any]:
        """Main method to process job description from database and save results"""
        try:
            # Test connections
            if not self.test_supabase_connection():
                raise Exception("Cannot connect to Supabase database")
            
            # Get job description from database
            logger.info("Fetching job description from database...")
            job_description, db_template_id, template_name, job_role = self.get_job_description_from_db(template_id)
            
            print(f"Processing Job:")
            print(f"  Template ID: {db_template_id}")
            print(f"  Template Name: {template_name}")
            print(f"  Job Role: {job_role}")
            print(f"  Job Description Length: {len(job_description)} characters")
            
            # Load template from local machine
            if not template_path:
                script_dir = os.path.dirname(os.path.abspath(__file__))
                template_path = os.path.join(script_dir, "JSON_Template", "json_template.json")
            
            logger.info(f"Loading JSON template from: {template_path}")
            template = self.load_json_template(template_path)
            
            # Extract information using Llama3
            logger.info("Extracting job information using Llama3...")
            llama_response = self.extract_job_info(job_description)
            
            if not llama_response:
                logger.warning("No response from Llama3, filling template with 'OPEN' values")
                # Create empty extracted data to fill with OPEN values
                extracted_data = {}
                filled_template = self.fill_json_template(template, extracted_data, db_template_id)
            else:
                # Parse Llama3 response
                logger.info("Parsing extracted information...")
                extracted_data = self.parse_llama_response(llama_response)
                
                # Fill template
                logger.info("Filling JSON template...")
                filled_template = self.fill_json_template(template, extracted_data, db_template_id)
            
            # Save filled template to initial_json_schema column (NOT final_json_schema)
            logger.info("Saving filled JSON to initial_json_schema column...")
            self.save_initial_json_to_db(db_template_id, filled_template)
            
            # Optionally save local backup named with template_id
            if save_local:
                script_dir = os.path.dirname(os.path.abspath(__file__))
                output_dir = os.path.join(script_dir, "Output")
                os.makedirs(output_dir, exist_ok=True)
                
                # Use template_id as filename
                output_filename = f"{db_template_id}.json"
                output_path = os.path.join(output_dir, output_filename)
                self.save_filled_template(filled_template, output_path)
            
            return filled_template
            
        except Exception as e:
            logger.error(f"Error processing job description: {e}")
            raise

def process_single_job(template_id: str = None):
    """Process a single job from the database"""
    parser = SupabaseJobDescriptionParser()
    
    try:
        print("=== Supabase Job Description Parser ===")
        print("Testing connections...")
        
        # Test Llama3 connection
        if not parser.test_llama_connection():
            print("Warning: Cannot connect to Llama3 API at http://localhost:11434")
            print("Make sure Ollama is running: 'ollama serve'")
            print("And Llama3 is installed: 'ollama pull llama3'")
            print("Proceeding with template filling using 'OPEN' values...\n")
        else:
            print("✓ Llama3 connection successful")
        
        # Test Supabase connection
        if not parser.test_supabase_connection():
            print("✗ Cannot connect to Supabase database")
            return
        else:
            print("✓ Supabase connection successful")
        
        # Process the job description
        print(f"\nProcessing template ID: {template_id if template_id else 'latest unprocessed'}")
        result = parser.process_job_description_from_db(template_id)
        
        print("\n=== Processing Complete ===")
        print(f"Template ID: {result.get('jobProfile', {}).get('JobId', 'N/A')}")
        print(f"Job Title: {result.get('jobProfile', {}).get('coreDetails', {}).get('title', 'N/A')}")
        print("Filled JSON saved to initial_json_schema column!")
        print("final_json_schema column remains empty as requested.")
        
    except Exception as e:
        print(f"Error: {e}")

def process_all_pending_jobs():
    """Process all pending jobs in the database"""
    parser = SupabaseJobDescriptionParser()
    
    if not parser.supabase_client:
        print("Error: Cannot initialize Supabase client")
        return
    
    try:
        # Get all unprocessed jobs
        result = parser.supabase_client.table("job_templates").select("template_id, user_job_description, template_name, job_role").is_("initial_json_schema", "null").eq("is_active", True).execute()
        
        if not result.data:
            print("No pending jobs found in database")
            return
        
        print(f"Found {len(result.data)} pending jobs to process")
        
        for job_data in result.data:
            template_id = job_data["template_id"]
            template_name = job_data.get("template_name", "Unknown")
            job_role = job_data.get("job_role", "Unknown")
            print(f"\nProcessing template ID: {template_id}")
            print(f"Template Name: {template_name}")
            print(f"Job Role: {job_role}")
            
            try:
                parser.process_job_description_from_db(template_id)
                print(f"✓ Successfully processed template ID: {template_id}")
            except Exception as e:
                print(f"✗ Failed to process template ID {template_id}: {e}")
                continue
        
        print("\n=== Batch Processing Complete ===")
        
    except Exception as e:
        print(f"Error in batch processing: {e}")

def main():
    """Main function with menu options"""
    print("=== Supabase Job Description Parser ===")
    print("1. Process specific job by Template ID")
    print("2. Process latest unprocessed job")
    print("3. Process all pending jobs")
    print("4. Exit")
    
    choice = input("\nEnter your choice (1-4): ").strip()
    
    if choice == "1":
        template_id = input("Enter template ID (UUID): ").strip()
        if template_id:
            process_single_job(template_id)
        else:
            print("Invalid template ID.")
    
    elif choice == "2":
        process_single_job()
    
    elif choice == "3":
        process_all_pending_jobs()
    
    elif choice == "4":
        print("Goodbye!")
        return
    
    else:
        print("Invalid choice. Please run the script again.")

if __name__ == "__main__":
    main()