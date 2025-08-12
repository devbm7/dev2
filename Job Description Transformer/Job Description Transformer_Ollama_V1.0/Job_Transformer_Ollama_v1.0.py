import json
import re
import os
from typing import Dict, Any, Optional
import requests
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobDescriptionParser:
    def __init__(self, llama_api_url: str = "http://localhost:11434/api/generate"):
        """
        Initialize the job description parser with Llama3 model
        
        Args:
            llama_api_url: URL for the Llama3 API endpoint (assumes Ollama is running locally)
        """
        self.llama_api_url = llama_api_url
        self.model_name = "llama3"
    
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
    
    def fill_json_template(self, template: Dict[str, Any], extracted_data: Dict[str, str]) -> Dict[str, Any]:
        """Fill the JSON template with extracted data"""
        filled_template = template.copy()
        
        # Generate a unique job ID
        job_id = f"job-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Fill core details
        filled_template["jobProfile"]["JobId"] = job_id
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
    
    def save_filled_template(self, filled_template: Dict[str, Any], output_path: str):
        """Save the filled template to a JSON file"""
        try:
            with open(output_path, 'w', encoding='utf-8') as file:
                json.dump(filled_template, file, indent=2, ensure_ascii=False)
            logger.info(f"Filled template saved to: {output_path}")
        except Exception as e:
            logger.error(f"Error saving filled template: {e}")
            raise
    
    def process_job_description(self, job_description: str, template_path: str, output_path: str) -> Dict[str, Any]:
        """Main method to process job description and fill template"""
        try:
            # Load template
            logger.info("Loading JSON template...")
            template = self.load_json_template(template_path)
            
            # Extract information using Llama3
            logger.info("Extracting job information using Llama3...")
            llama_response = self.extract_job_info(job_description)
            
            if not llama_response:
                logger.warning("No response from Llama3, filling template with 'OPEN' values")
                # Create empty extracted data to fill with OPEN values
                extracted_data = {}
                filled_template = self.fill_json_template(template, extracted_data)
            else:
                # Parse Llama3 response
                logger.info("Parsing extracted information...")
                extracted_data = self.parse_llama_response(llama_response)
                
                # Fill template
                logger.info("Filling JSON template...")
                filled_template = self.fill_json_template(template, extracted_data)
            
            # Save result
            self.save_filled_template(filled_template, output_path)
            
            return filled_template
            
        except Exception as e:
            logger.error(f"Error processing job description: {e}")
            raise

def main():
    """Main function to run the job description parser"""
    
    # Initialize parser
    parser = JobDescriptionParser()
    
    # Get job description from user
    print("=== Job Description Parser ===")
    print("Please enter the job description (press Enter twice to finish):")
    
    job_description_lines = []
    empty_line_count = 0
    
    while True:
        line = input()
        if line == "":
            empty_line_count += 1
            if empty_line_count >= 2:
                break
        else:
            empty_line_count = 0
            job_description_lines.append(line)
    
    job_description = "\n".join(job_description_lines)
    
    if not job_description.strip():
        print("Error: No job description provided.")
        return
    
    # Set file paths - use the specific template and output directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    template_path = os.path.join(script_dir, "JSON_Template", "json_template.json")
    output_dir = os.path.join(script_dir, "Output")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate output filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"filled_job_template_{timestamp}.json"
    output_path = os.path.join(output_dir, output_filename)
    
    try:
        # Test Llama3 connection first
        print("Testing Llama3 connection...")
        if not parser.test_llama_connection():
            print("Warning: Cannot connect to Llama3 API at http://localhost:11434")
            print("Make sure Ollama is running: 'ollama serve'")
            print("And Llama3 is installed: 'ollama pull llama3'")
            print("Proceeding with template filling using 'OPEN' values...\n")
        
        # Process the job description
        result = parser.process_job_description(job_description, template_path, output_path)
        
        print("\n=== Processing Complete ===")
        print(f"Filled template saved to: {output_path}")
        print(f"\nJob ID: {result.get('jobProfile', {}).get('JobId', 'N/A')}")
        print(f"Job Title: {result.get('jobProfile', {}).get('coreDetails', {}).get('title', 'N/A')}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()