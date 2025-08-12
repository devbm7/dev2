"""
Interview Performance Evaluation Module V1.0

This module evaluates interviewee performance based on interview session data
stored in Supabase and uses Ollama Llama3 for intelligent analysis.

Features:
- Extracts interview session details from Supabase
- Fetches job descriptions from job templates
- Analyzes conversation between user and assistant
- Generates detailed performance ratings
- Creates professional JSON evaluation reports
- Stores results back to the database

Author: Blink Analytics
Date: August 7, 2025
"""

import json
import os
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
import requests
from supabase import create_client, Client

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class InterviewEvaluationModule:
    def __init__(self, ollama_api_url: str = "http://localhost:11434/api/generate"):
        """
        Initialize the Interview Evaluation Module
        
        Args:
            ollama_api_url: URL for the Ollama API endpoint
        """
        self.ollama_api_url = ollama_api_url
        self.model_name = "llama3"
        
        # Initialize Supabase connection
        self.supabase_client = self._initialize_supabase()
        
        # Define evaluation criteria
        self.evaluation_criteria = self._initialize_evaluation_criteria()
    
    def _initialize_supabase(self) -> Optional[Client]:
        """Initialize Supabase client from environment variables"""
        try:
            supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
            
            if not supabase_url:
                logger.error("SUPABASE_URL environment variable is required")
                logger.error("Please set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in your environment")
                return None
            
            if not supabase_key:
                logger.error("Supabase key environment variable is required")
                logger.error("Please set one of: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY")
                return None
            
            client = create_client(supabase_url, supabase_key)
            logger.info("Supabase client initialized successfully")
            return client
            
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    
    def _initialize_evaluation_criteria(self) -> Dict[str, Dict[str, Any]]:
        """Initialize comprehensive evaluation criteria"""
        return {
            "technical_competency": {
                "weight": 0.30,
                "sub_criteria": [
                    "depth_of_knowledge",
                    "problem_solving_approach",
                    "technical_accuracy",
                    "coding_skills",
                    "system_design_understanding"
                ]
            },
            "communication_skills": {
                "weight": 0.25,
                "sub_criteria": [
                    "clarity_of_expression",
                    "active_listening",
                    "question_asking_ability",
                    "explanation_skills",
                    "confidence_level"
                ]
            },
            "behavioral_traits": {
                "weight": 0.20,
                "sub_criteria": [
                    "cultural_fit",
                    "leadership_potential",
                    "teamwork_orientation",
                    "adaptability",
                    "initiative_taking"
                ]
            },
            "domain_expertise": {
                "weight": 0.15,
                "sub_criteria": [
                    "industry_knowledge",
                    "relevant_experience",
                    "best_practices_awareness",
                    "trends_understanding"
                ]
            },
            "overall_performance": {
                "weight": 0.10,
                "sub_criteria": [
                    "interview_preparedness",
                    "professionalism",
                    "enthusiasm",
                    "time_management"
                ]
            }
        }
    
    def test_database_connection(self) -> bool:
        """
        Test database connection and permissions
        
        Returns:
            True if connection and permissions are working, False otherwise
        """
        try:
            if not self.supabase_client:
                logger.error("Supabase client not initialized")
                return False
            
            logger.info("Testing database connection...")
            
            # Test basic connection by querying interview_sessions table
            response = self.supabase_client.table("interview_sessions") \
                .select("session_id") \
                .limit(1) \
                .execute()
            
            logger.info(f"Connection test response: {response}")
            
            if hasattr(response, 'error') and response.error:
                logger.error(f"Database connection error: {response.error}")
                return False
            
            logger.info("✅ Database connection successful")
            
            # Test if Interview_report column exists (note: capital I)
            try:
                response = self.supabase_client.table("interview_sessions") \
                    .select("session_id, Interview_report") \
                    .limit(1) \
                    .execute()
                
                logger.info("✅ Interview_report column accessible")
                return True
                
            except Exception as col_error:
                logger.error(f"❌ Interview_report column may not exist: {col_error}")
                logger.info("Please run the database schema update script to add the required columns")
                return False
            
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False
    
    def fetch_interview_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch interview session details from Supabase
        
        Args:
            session_id: UUID of the interview session
            
        Returns:
            Dictionary containing session information or None if not found
        """
        try:
            if not self.supabase_client:
                logger.error("Supabase client not initialized")
                return None
            
            # Fetch interview session with related data
            response = self.supabase_client.table("interview_sessions") \
                .select("*, session_information") \
                .eq("session_id", session_id) \
                .execute()
            
            if response.data and len(response.data) > 0:
                session_data = response.data[0]
                logger.info(f"Successfully fetched interview session: {session_id}")
                return session_data
            else:
                logger.warning(f"No interview session found with ID: {session_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching interview session {session_id}: {e}")
            return None
    
    def fetch_job_description(self, template_id: str) -> Optional[str]:
        """
        Fetch job description from job templates table
        
        Args:
            template_id: UUID of the job template
            
        Returns:
            Job description string or None if not found
        """
        try:
            if not self.supabase_client:
                logger.error("Supabase client not initialized")
                return None
            
            # Fetch job template
            response = self.supabase_client.table("job_templates") \
                .select("user_job_description") \
                .eq("template_id", template_id) \
                .execute()
            
            if response.data and len(response.data) > 0:
                template_data = response.data[0]
                
                # Get job description from user_job_description field
                job_description = template_data.get("user_job_description")
                
                if job_description and isinstance(job_description, str) and job_description.strip():
                    logger.info(f"Successfully fetched job description for template: {template_id}")
                    return job_description.strip()
                else:
                    logger.warning(f"No job description found for template: {template_id}")
                    return None
            else:
                logger.warning(f"No job template found with ID: {template_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching job description for template {template_id}: {e}")
            return None
    
    def _extract_job_description_from_jsonb(self, jsonb_data: Any) -> Optional[str]:
        """
        Extract job description text from JSONB data
        
        Args:
            jsonb_data: JSONB data that may contain job description
            
        Returns:
            Extracted job description string or None
        """
        try:
            if not jsonb_data:
                return None
            
            # If it's already a string, return it
            if isinstance(jsonb_data, str):
                return jsonb_data.strip() if jsonb_data.strip() else None
            
            # If it's a dictionary, look for common job description keys
            if isinstance(jsonb_data, dict):
                # Common keys that might contain job description text
                description_keys = [
                    "job_description", "description", "jobDescription",
                    "job_summary", "summary", "jobSummary",
                    "overview", "about", "details",
                    "role_description", "roleDescription",
                    "position_description", "positionDescription",
                    "content", "text", "body",
                    "full_description", "fullDescription"
                ]
                
                # Try to find job description in the JSONB structure
                for key in description_keys:
                    if key in jsonb_data:
                        value = jsonb_data[key]
                        if isinstance(value, str) and value.strip():
                            return value.strip()
                        elif isinstance(value, dict):
                            # Recursively search nested structures
                            nested_result = self._extract_job_description_from_jsonb(value)
                            if nested_result:
                                return nested_result
                        elif isinstance(value, list):
                            # Handle list of strings
                            text_parts = []
                            for item in value:
                                if isinstance(item, str) and item.strip():
                                    text_parts.append(item.strip())
                            if text_parts:
                                return "\n".join(text_parts)
                
                # If no specific key found, try to build comprehensive description
                description_parts = []
                
                # Handle structured job information
                if "job_title" in jsonb_data:
                    description_parts.append(f"Position: {jsonb_data['job_title']}")
                
                if "job_summary" in jsonb_data and isinstance(jsonb_data["job_summary"], str):
                    description_parts.append(f"Summary: {jsonb_data['job_summary']}")
                
                # Handle responsibilities
                if "responsibilities" in jsonb_data:
                    resp = jsonb_data["responsibilities"]
                    if isinstance(resp, list):
                        description_parts.append("Responsibilities:")
                        for item in resp:
                            if isinstance(item, str):
                                description_parts.append(f"- {item}")
                    elif isinstance(resp, str):
                        description_parts.append(f"Responsibilities: {resp}")
                
                # Handle requirements
                if "requirements" in jsonb_data:
                    req = jsonb_data["requirements"]
                    if isinstance(req, list):
                        description_parts.append("Requirements:")
                        for item in req:
                            if isinstance(item, str):
                                description_parts.append(f"- {item}")
                    elif isinstance(req, str):
                        description_parts.append(f"Requirements: {req}")
                
                # Handle preferred qualifications
                if "preferred_qualifications" in jsonb_data:
                    pref = jsonb_data["preferred_qualifications"]
                    if isinstance(pref, list):
                        description_parts.append("Preferred Qualifications:")
                        for item in pref:
                            if isinstance(item, str):
                                description_parts.append(f"- {item}")
                    elif isinstance(pref, str):
                        description_parts.append(f"Preferred Qualifications: {pref}")
                
                # Handle employment details
                if "employment_details" in jsonb_data and isinstance(jsonb_data["employment_details"], dict):
                    emp_details = jsonb_data["employment_details"]
                    details_text = []
                    for key, value in emp_details.items():
                        if isinstance(value, str):
                            details_text.append(f"{key.replace('_', ' ').title()}: {value}")
                    if details_text:
                        description_parts.append("Employment Details:")
                        description_parts.extend([f"- {detail}" for detail in details_text])
                
                # If we built a structured description, return it
                if description_parts:
                    combined_description = "\n\n".join(description_parts)
                    if len(combined_description) > 50:
                        return combined_description
                
                # Last resort: concatenate all string values
                all_text_parts = []
                for key, value in jsonb_data.items():
                    if isinstance(value, str) and value.strip() and len(value) > 10:
                        all_text_parts.append(f"{key.replace('_', ' ').title()}: {value.strip()}")
                
                if all_text_parts:
                    combined_description = "\n\n".join(all_text_parts)
                    # Only return if we have substantial content
                    if len(combined_description) > 50:
                        return combined_description
            
            # If it's a list, try to extract from each item
            elif isinstance(jsonb_data, list):
                all_descriptions = []
                for item in jsonb_data:
                    extracted = self._extract_job_description_from_jsonb(item)
                    if extracted:
                        all_descriptions.append(extracted)
                
                if all_descriptions:
                    return "\n\n".join(all_descriptions)
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting job description from JSONB: {e}")
            return None
    
    def extract_conversation_data(self, session_information: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Extract conversation between user and assistant from session information
        
        Args:
            session_information: JSON object containing interview session data
            
        Returns:
            List of conversation exchanges
        """
        try:
            conversation = []
            
            # Handle the actual structure we found: session_information is a list
            if isinstance(session_information, list) and session_information:
                # Get the first (and likely only) session data item
                session_item = session_information[0]
                
                if isinstance(session_item, dict) and 'session_data' in session_item:
                    session_data = session_item['session_data']
                    
                    # Look for conversation_history
                    if 'conversation_history' in session_data:
                        conversation_history = session_data['conversation_history']
                        
                        if isinstance(conversation_history, list):
                            for exchange in conversation_history:
                                if isinstance(exchange, dict):
                                    # Standardize the format
                                    standardized_exchange = {}
                                    
                                    # Map different possible keys to standard format
                                    for role_key in ["role", "speaker", "type"]:
                                        if role_key in exchange:
                                            standardized_exchange["role"] = exchange[role_key]
                                            break
                                    
                                    for message_key in ["message", "content", "text", "response"]:
                                        if message_key in exchange:
                                            standardized_exchange["content"] = exchange[message_key]
                                            break
                                    
                                    if "role" in standardized_exchange and "content" in standardized_exchange:
                                        conversation.append(standardized_exchange)
            
            # Fallback: Handle original expected structure as dict
            elif isinstance(session_information, dict):
                # Look for conversation data in various possible keys
                conversation_keys = ["conversation", "chat_history", "messages", "qa_pairs", "dialogue", "conversation_history"]
                
                for key in conversation_keys:
                    if key in session_information:
                        raw_conversation = session_information[key]
                        if isinstance(raw_conversation, list):
                            for exchange in raw_conversation:
                                if isinstance(exchange, dict):
                                    # Standardize the format
                                    standardized_exchange = {}
                                    
                                    # Map different possible keys to standard format
                                    for role_key in ["role", "speaker", "type"]:
                                        if role_key in exchange:
                                            standardized_exchange["role"] = exchange[role_key]
                                            break
                                    
                                    for message_key in ["message", "content", "text", "response"]:
                                        if message_key in exchange:
                                            standardized_exchange["content"] = exchange[message_key]
                                            break
                                    
                                    if "role" in standardized_exchange and "content" in standardized_exchange:
                                        conversation.append(standardized_exchange)
                        break
                
                # If no structured conversation found, look for Q&A pairs
                if not conversation:
                    if "questions" in session_information and "answers" in session_information:
                        questions = session_information["questions"]
                        answers = session_information["answers"]
                        
                        if isinstance(questions, list) and isinstance(answers, list):
                            for i, (q, a) in enumerate(zip(questions, answers)):
                                conversation.extend([
                                    {"role": "assistant", "content": str(q)},
                                    {"role": "user", "content": str(a)}
                                ])
            
            logger.info(f"Extracted {len(conversation)} conversation exchanges")
            return conversation
            
        except Exception as e:
            logger.error(f"Error extracting conversation data: {e}")
            return []
    
    def generate_evaluation_prompt(self, conversation: List[Dict[str, str]], 
                                 job_description: str) -> str:
        """
        Generate comprehensive evaluation prompt for Ollama
        
        Args:
            conversation: List of conversation exchanges
            job_description: Job description text
            
        Returns:
            Formatted prompt for evaluation
        """
        conversation_text = ""
        for exchange in conversation:
            role = exchange.get("role", "unknown")
            content = exchange.get("content", "")
            conversation_text += f"{role.upper()}: {content}\n\n"
        
        prompt = f"""
You are an expert HR professional and technical interviewer. Analyze the following interview conversation and provide a comprehensive evaluation of the candidate's performance.

JOB DESCRIPTION:
{job_description}

INTERVIEW CONVERSATION:
{conversation_text}

Please evaluate the candidate across the following dimensions and provide scores from 1-10 (10 being excellent):

1. TECHNICAL COMPETENCY (30% weight):
   - Depth of Knowledge: How well does the candidate understand the technical concepts?
   - Problem Solving: How effectively do they approach and solve problems?
   - Technical Accuracy: Are their technical explanations correct and precise?
   - Coding Skills: If applicable, how are their programming/coding abilities?
   - System Design: Do they understand system architecture and design principles?

2. COMMUNICATION SKILLS (25% weight):
   - Clarity of Expression: How clearly do they communicate their thoughts?
   - Active Listening: Do they listen carefully and respond appropriately?
   - Question Asking: Do they ask thoughtful, relevant questions?
   - Explanation Skills: Can they explain complex topics simply?
   - Confidence Level: How confident and composed are they?

3. BEHAVIORAL TRAITS (20% weight):
   - Cultural Fit: How well would they fit with the company culture?
   - Leadership Potential: Do they show leadership qualities?
   - Teamwork Orientation: Do they demonstrate collaborative skills?
   - Adaptability: How well do they handle unexpected questions or scenarios?
   - Initiative Taking: Do they show proactiveness and initiative?

4. DOMAIN EXPERTISE (15% weight):
   - Industry Knowledge: How well do they understand the industry?
   - Relevant Experience: Is their experience relevant to the role?
   - Best Practices: Are they aware of industry best practices?
   - Trends Understanding: Do they understand current industry trends?

5. OVERALL PERFORMANCE (10% weight):
   - Interview Preparedness: How well prepared were they?
   - Professionalism: Did they maintain professional demeanor?
   - Enthusiasm: How enthusiastic are they about the role?
   - Time Management: Did they manage time effectively during responses?

Please provide your evaluation in the following JSON format. IMPORTANT: Return ONLY the JSON object, no additional text or explanation:

{{
    "evaluation_summary": {{
        "overall_score": <1-10>,
        "overall_rating": "<Excellent/Good/Average/Below Average/Poor>",
        "recommendation": "<Strong Hire/Hire/Maybe/No Hire/Strong No Hire>",
        "summary_feedback": "<2-3 sentence overall summary>"
    }},
    "detailed_scores": {{
        "technical_competency": {{
            "overall_score": <1-10>,
            "depth_of_knowledge": <1-10>,
            "problem_solving_approach": <1-10>,
            "technical_accuracy": <1-10>,
            "coding_skills": <1-10>,
            "system_design_understanding": <1-10>,
            "feedback": "<detailed feedback>"
        }},
        "communication_skills": {{
            "overall_score": <1-10>,
            "clarity_of_expression": <1-10>,
            "active_listening": <1-10>,
            "question_asking_ability": <1-10>,
            "explanation_skills": <1-10>,
            "confidence_level": <1-10>,
            "feedback": "<detailed feedback>"
        }},
        "behavioral_traits": {{
            "overall_score": <1-10>,
            "cultural_fit": <1-10>,
            "leadership_potential": <1-10>,
            "teamwork_orientation": <1-10>,
            "adaptability": <1-10>,
            "initiative_taking": <1-10>,
            "feedback": "<detailed feedback>"
        }},
        "domain_expertise": {{
            "overall_score": <1-10>,
            "industry_knowledge": <1-10>,
            "relevant_experience": <1-10>,
            "best_practices_awareness": <1-10>,
            "trends_understanding": <1-10>,
            "feedback": "<detailed feedback>"
        }},
        "overall_performance": {{
            "overall_score": <1-10>,
            "interview_preparedness": <1-10>,
            "professionalism": <1-10>,
            "enthusiasm": <1-10>,
            "time_management": <1-10>,
            "feedback": "<detailed feedback>"
        }}
    }},
    "strengths": [
        "<list of candidate's key strengths>"
    ],
    "areas_for_improvement": [
        "<list of areas where candidate can improve>"
    ],
    "specific_examples": [
        "<specific examples from the conversation that support the evaluation>"
    ],
    "follow_up_questions": [
        "<suggested follow-up questions for next rounds>"
    ],
    "evaluation_metadata": {{
        "evaluated_by": "Ollama Llama3 AI Assistant",
        "evaluation_date": "{datetime.now().isoformat()}",
        "evaluation_version": "1.0",
        "job_relevance_score": <1-10>
    }}
}}

IMPORTANT: Your response must be ONLY valid JSON. Do not include any explanatory text, markdown formatting, or additional commentary. Return only the JSON object above with all fields properly filled out.
"""
        return prompt
    
    def call_ollama_api(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        Call Ollama API to generate evaluation
        
        Args:
            prompt: Evaluation prompt
            
        Returns:
            Parsed evaluation JSON or None if failed
        """
        try:
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "top_p": 0.9,
                    "max_tokens": 4000
                }
            }
            
            logger.info("Sending request to Ollama API...")
            response = requests.post(
                self.ollama_api_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=120
            )
            
            if response.status_code == 200:
                response_data = response.json()
                raw_response = response_data.get("response", "")
                
                # Try to extract JSON from the response
                try:
                    # Look for JSON content between ```json and ``` or just raw JSON
                    if "```json" in raw_response:
                        json_start = raw_response.find("```json") + 7
                        json_end = raw_response.find("```", json_start)
                        json_content = raw_response[json_start:json_end].strip()
                    elif raw_response.strip().startswith("{"):
                        # Handle case where response starts with JSON but may have extra content
                        json_content = self._extract_first_complete_json(raw_response.strip())
                    else:
                        # Try to find JSON-like content
                        start_idx = raw_response.find("{")
                        if start_idx != -1:
                            # Extract the first complete JSON object
                            json_content = self._extract_first_complete_json(raw_response[start_idx:])
                        else:
                            raise ValueError("No JSON content found in response")
                    
                    if not json_content:
                        raise ValueError("Could not extract valid JSON content")
                    
                    # Clean up common JSON issues from AI responses
                    json_content = self._clean_json_response(json_content)
                    
                    evaluation_result = json.loads(json_content)
                    logger.info("Successfully generated evaluation report")
                    return evaluation_result
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON response: {e}")
                    logger.error(f"Raw response: {raw_response[:500]}...")
                    return None
            else:
                logger.error(f"Ollama API request failed with status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error calling Ollama API: {e}")
            return None
    
    def _extract_first_complete_json(self, text: str) -> str:
        """
        Extract the first complete JSON object from text that may contain extra content
        
        Args:
            text: Text that may contain JSON with extra content
            
        Returns:
            First complete JSON object as string
        """
        try:
            brace_count = 0
            start_idx = -1
            
            for i, char in enumerate(text):
                if char == '{':
                    if start_idx == -1:
                        start_idx = i
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0 and start_idx != -1:
                        # Found complete JSON object
                        return text[start_idx:i+1]
            
            # If we didn't find a complete object, return empty string
            return ""
            
        except Exception as e:
            logger.warning(f"Error extracting JSON object: {e}")
            return ""
    
    def _clean_json_response(self, json_content: str) -> str:
        """
        Clean up common JSON issues from AI responses
        
        Args:
            json_content: Raw JSON content from AI response
            
        Returns:
            Cleaned JSON content
        """
        try:
            # Replace common invalid JSON values
            json_content = json_content.replace('"N/A"', 'null')
            json_content = json_content.replace("'N/A'", 'null')
            json_content = json_content.replace(': N/A', ': null')
            json_content = json_content.replace(':N/A', ': null')
            
            # Fix common formatting issues
            json_content = json_content.replace('\n', ' ').replace('\r', ' ')
            
            # Remove any trailing commas before closing braces/brackets
            import re
            json_content = re.sub(r',(\s*[}\]])', r'\1', json_content)
            
            return json_content
            
        except Exception as e:
            logger.warning(f"Error cleaning JSON response: {e}")
            return json_content
    
    def save_evaluation_report(self, session_id: str, evaluation_report: Dict[str, Any]) -> bool:
        """
        Save evaluation report to the database
        
        Args:
            session_id: UUID of the interview session
            evaluation_report: Generated evaluation report
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not self.supabase_client:
                logger.error("Supabase client not initialized")
                return False
            
            logger.info(f"Attempting to save evaluation report for session: {session_id}")
            logger.debug(f"Report data preview: {str(evaluation_report)[:200]}...")
            
            # First, verify the session exists
            check_response = self.supabase_client.table("interview_sessions") \
                .select("session_id") \
                .eq("session_id", session_id) \
                .execute()
            
            if not check_response.data or len(check_response.data) == 0:
                logger.error(f"Session {session_id} not found in database")
                return False
            
            # Update the interview_sessions table with the evaluation report
            update_response = self.supabase_client.table("interview_sessions") \
                .update({"Interview_report": evaluation_report}) \
                .eq("session_id", session_id) \
                .execute()
            
            logger.debug(f"Update response: {update_response}")
            
            # Check if the update was successful
            if update_response.data and len(update_response.data) > 0:
                logger.info(f"Successfully saved evaluation report for session: {session_id}")
                
                # Verify the data was actually saved
                verify_response = self.supabase_client.table("interview_sessions") \
                    .select("Interview_report") \
                    .eq("session_id", session_id) \
                    .execute()
                
                if verify_response.data and verify_response.data[0].get("Interview_report"):
                    logger.info("Verification: Report successfully stored in database")
                    return True
                else:
                    logger.warning("Verification failed: Report not found in database after update")
                    return False
            else:
                logger.error(f"Update failed - no data returned. Response: {update_response}")
                
                # Check for errors in the response
                if hasattr(update_response, 'error') and update_response.error:
                    logger.error(f"Supabase error: {update_response.error}")
                
                return False
                
        except Exception as e:
            logger.error(f"Error saving evaluation report for session {session_id}: {e}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False
    
    def evaluate_interview_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Main method to evaluate an interview session
        
        Args:
            session_id: UUID of the interview session to evaluate
            
        Returns:
            Evaluation report or None if failed
        """
        try:
            logger.info(f"Starting evaluation for interview session: {session_id}")
            
            # Step 1: Fetch interview session data
            session_data = self.fetch_interview_session(session_id)
            if not session_data:
                return None
            
            # Step 2: Extract session information
            session_information = session_data.get("session_information")
            if not session_information:
                logger.error("No session_information found in interview session")
                return None
            
            # Step 3: Fetch job description
            template_id = session_data.get("template_id")
            if not template_id:
                logger.error("No template_id found in interview session")
                return None
            
            job_description = self.fetch_job_description(template_id)
            if not job_description:
                logger.error("Could not fetch job description")
                return None
            
            # Step 4: Extract conversation data
            conversation = self.extract_conversation_data(session_information)
            if not conversation:
                logger.error("Could not extract conversation data")
                return None
            
            # Step 5: Generate evaluation prompt
            prompt = self.generate_evaluation_prompt(conversation, job_description)
            
            # Step 6: Call Ollama API for evaluation
            evaluation_report = self.call_ollama_api(prompt)
            if not evaluation_report:
                return None
            
            # Step 7: Save evaluation report to database
            saved = self.save_evaluation_report(session_id, evaluation_report)
            if not saved:
                logger.warning("Failed to save evaluation report to database")
            
            logger.info(f"Successfully completed evaluation for session: {session_id}")
            return evaluation_report
            
        except Exception as e:
            logger.error(f"Error evaluating interview session {session_id}: {e}")
            return None
    
    def batch_evaluate_sessions(self, session_ids: List[str]) -> Dict[str, Any]:
        """
        Evaluate multiple interview sessions in batch
        
        Args:
            session_ids: List of session IDs to evaluate
            
        Returns:
            Dictionary containing results for each session
        """
        results = {
            "successful_evaluations": [],
            "failed_evaluations": [],
            "total_processed": len(session_ids),
            "success_rate": 0.0
        }
        
        for session_id in session_ids:
            try:
                evaluation = self.evaluate_interview_session(session_id)
                if evaluation:
                    results["successful_evaluations"].append({
                        "session_id": session_id,
                        "evaluation": evaluation
                    })
                else:
                    results["failed_evaluations"].append(session_id)
            except Exception as e:
                logger.error(f"Error processing session {session_id}: {e}")
                results["failed_evaluations"].append(session_id)
        
        results["success_rate"] = len(results["successful_evaluations"]) / len(session_ids) * 100
        
        logger.info(f"Batch evaluation completed: {results['success_rate']:.1f}% success rate")
        return results


def main():
    """
    Main function for command-line usage
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Interview Performance Evaluation Module")
    parser.add_argument("--session-id", type=str, help="Interview session ID to evaluate")
    parser.add_argument("--batch-file", type=str, help="File containing session IDs (one per line)")
    parser.add_argument("--ollama-url", type=str, default="http://localhost:11434/api/generate",
                       help="Ollama API URL")
    
    args = parser.parse_args()
    
    # Initialize evaluation module
    evaluator = InterviewEvaluationModule(ollama_api_url=args.ollama_url)
    
    if args.session_id:
        # Evaluate single session
        result = evaluator.evaluate_interview_session(args.session_id)
        if result:
            print("Evaluation completed successfully!")
            print(json.dumps(result, indent=2))
        else:
            print("Evaluation failed!")
    
    elif args.batch_file:
        # Evaluate multiple sessions
        try:
            with open(args.batch_file, 'r') as f:
                session_ids = [line.strip() for line in f if line.strip()]
            
            results = evaluator.batch_evaluate_sessions(session_ids)
            print(f"Batch evaluation completed!")
            print(f"Success rate: {results['success_rate']:.1f}%")
            print(f"Successful: {len(results['successful_evaluations'])}")
            print(f"Failed: {len(results['failed_evaluations'])}")
            
        except FileNotFoundError:
            print(f"File not found: {args.batch_file}")
    
    else:
        print("Please provide either --session-id or --batch-file")


if __name__ == "__main__":
    main()
