# Interview Performance Evaluation Module V1.0

A comprehensive AI-powered interview evaluation system that analyzes interview conversations and provides detailed performance assessments using Ollama Llama3.

## 🚀 Features

- **🤖 AI-Powered Analysis**: Uses Ollama Llama3 for intelligent interview evaluation
- **📊 Comprehensive Scoring**: Evaluates across 5 key dimensions with weighted scoring
- **🎯 Job-Specific Analysis**: Tailors evaluations based on actual job descriptions
- **📋 Professional Reports**: Generates detailed JSON evaluation reports with actionable insights
- **🗄️ Database Integration**: Seamlessly integrates with Supabase for data management
- **⚡ Batch Processing**: Supports evaluating multiple interviews simultaneously
- **🔍 Detailed Feedback**: Provides strengths, improvement areas, and follow-up questions

## 📋 Prerequisites

### 1. Ollama with Llama3
Make sure Ollama is installed and running with the Llama3 model:

```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull Llama3 model
ollama pull llama3

# Start Ollama service
ollama serve
```

### 2. Python Dependencies
Install the required packages:

```bash
pip install -r requirements.txt
```

### 3. Database Setup
Ensure your Supabase database has the required structure:
- `interview_sessions` table with `session_information` and `Interview_report` columns
- `job_templates` table with job description fields
- Proper access permissions configured

## ⚙️ Configuration

### Environment Variables
Set up your environment variables for database connection:

```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# Optional: Custom Ollama URL
OLLAMA_API_URL=http://localhost:11434/api/generate
```

## 🚀 Quick Start

### Method 1: Simple Example (Recommended)
```bash
python run_evaluation_example.py
```
This will automatically test the system and evaluate a sample interview session.

### Method 2: Interactive Mode
```bash
python run_interactive.py
```
This provides a step-by-step interactive interface for evaluating interviews.

### Method 3: Command Line Interface

#### Evaluate a Single Interview Session
```bash
python Evaluation_Module_V1.0.py --session-id "your-session-uuid"
```

#### Batch Evaluate Multiple Sessions
```bash
# Create a file with session IDs (one per line)
echo "session-uuid-1" > sessions.txt
echo "session-uuid-2" >> sessions.txt

python Evaluation_Module_V1.0.py --batch-file sessions.txt
```

#### Custom Ollama URL
```bash
python Evaluation_Module_V1.0.py --session-id "your-session-uuid" --ollama-url "http://custom-host:11434/api/generate"
```

### Method 4: Python API Integration

```python
# Import the evaluation module
import importlib.util
spec = importlib.util.spec_from_file_location("evaluation_module", "Evaluation_Module_V1.0.py")
evaluation_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluation_module)

# Initialize the evaluator
evaluator = evaluation_module.InterviewEvaluationModule()

# Test database connection
if not evaluator.test_database_connection():
    print("Database connection failed")
    exit(1)

# Evaluate a single session
evaluation = evaluator.evaluate_interview_session("your-session-uuid")

# Batch evaluate multiple sessions
session_ids = ["uuid1", "uuid2", "uuid3"]
results = evaluator.batch_evaluate_sessions(session_ids)
```

## 📊 Evaluation Criteria

The module evaluates candidates across 5 key dimensions with weighted scoring:

### 1. 🔧 Technical Competency (30% weight)
- **Depth of Knowledge**: Understanding of technical concepts
- **Problem Solving Approach**: How effectively they solve problems
- **Technical Accuracy**: Correctness of technical explanations
- **Coding Skills**: Programming and coding abilities
- **System Design Understanding**: Architecture and design knowledge

### 2. 💬 Communication Skills (25% weight)
- **Clarity of Expression**: How clearly they communicate thoughts
- **Active Listening**: Listening and responding appropriately
- **Question Asking Ability**: Quality of questions asked
- **Explanation Skills**: Ability to explain complex topics simply
- **Confidence Level**: Composure and confidence during interview

### 3. 🤝 Behavioral Traits (20% weight)
- **Cultural Fit**: Alignment with company culture
- **Leadership Potential**: Leadership qualities demonstrated
- **Teamwork Orientation**: Collaborative skills
- **Adaptability**: Handling unexpected questions/scenarios
- **Initiative Taking**: Proactiveness and initiative

### 4. 🎯 Domain Expertise (15% weight)
- **Industry Knowledge**: Understanding of the industry
- **Relevant Experience**: Relevance of past experience
- **Best Practices Awareness**: Knowledge of industry standards
- **Trends Understanding**: Awareness of current trends

### 5. ⭐ Overall Performance (10% weight)
- **Interview Preparedness**: Level of preparation
- **Professionalism**: Professional demeanor maintained
- **Enthusiasm**: Enthusiasm for the role
- **Time Management**: Effective time management during responses

## 📋 Output Format

The evaluation generates a comprehensive JSON report with:

```json
{
  "evaluation_summary": {
    "overall_score": 8.5,
    "overall_rating": "Good",
    "recommendation": "Hire",
    "summary_feedback": "Strong technical candidate with excellent communication skills..."
  },
  "detailed_scores": {
    "technical_competency": {
      "overall_score": 9.0,
      "depth_of_knowledge": 9,
      "problem_solving_approach": 8,
      "technical_accuracy": 9,
      "coding_skills": 8,
      "system_design_understanding": 9,
      "feedback": "Demonstrates deep understanding of core concepts..."
    }
    // ... other dimensions
  },
  "strengths": [
    "Excellent problem-solving approach",
    "Clear communication style"
  ],
  "areas_for_improvement": [
    "Could improve system design knowledge",
    "More industry-specific examples needed"
  ],
  "specific_examples": [
    "When asked about database optimization, provided detailed explanation..."
  ],
  "follow_up_questions": [
    "How would you handle database scaling challenges?",
    "Tell us about a time you improved system performance"
  ],
  "evaluation_metadata": {
    "evaluated_by": "Ollama Llama3 AI Assistant",
    "evaluation_date": "2025-08-07T10:30:00",
    "evaluation_version": "1.0",
    "job_relevance_score": 8
  }
}
```

## Session Information Format

The `session_information` field should contain interview conversation data in one of these formats:

### Format 1: Structured Conversation
```json
{
  "conversation": [
    {"role": "assistant", "content": "Tell me about your experience with Python"},
    {"role": "user", "content": "I have 5 years of experience developing web applications..."},
    {"role": "assistant", "content": "Can you explain how you would optimize a slow database query?"},
    {"role": "user", "content": "I would start by analyzing the query execution plan..."}
  ]
}
```

### Format 2: Q&A Pairs
```json
{
  "questions": [
    "Tell me about your experience with Python",
    "How would you optimize a slow database query?"
  ],
  "answers": [
    "I have 5 years of experience developing web applications...",
    "I would start by analyzing the query execution plan..."
  ]
}
```

## Database Schema Requirements

To use this module, ensure your database has these columns:

```sql
-- Add session_information column to interview_sessions table
ALTER TABLE interview_sessions 
ADD COLUMN session_information JSONB;

-- Add interview_report column to interview_sessions table  
ALTER TABLE interview_sessions 
ADD COLUMN interview_report JSONB;

-- Add job description columns to job_templates table (JSONB format)
ALTER TABLE job_templates 
ADD COLUMN final_job_description JSONB,
ADD COLUMN initial_job_description JSONB;
```

## 🔧 Troubleshooting

### Common Issues

#### 1. 🔌 Ollama Connection Error
```bash
# Check if Ollama is running
ollama serve

# Verify Llama3 model is available
ollama list

# Test Ollama API directly
curl http://localhost:11434/api/generate -d '{"model":"llama3","prompt":"test"}'
```

#### 2. 🗄️ Database Connection Error
- ✅ Verify environment variables are set correctly
- ✅ Check Supabase service role key permissions
- ✅ Ensure the Supabase URL format is correct
- ✅ Test database connection with the provided test scripts

#### 3. 💬 No Conversation Data Found
- ✅ Verify `session_information` field contains conversation data
- ✅ Check that conversation format matches expected structure
- ✅ Ensure the session ID exists in the database
- ✅ Use the schema test script to verify data structure

#### 4. 📄 JSON Parsing Error from AI
- ✅ The AI model might return malformed JSON occasionally
- ✅ Check Ollama logs for response format issues
- ✅ The module includes automatic JSON cleaning and retry logic
- ✅ Consider adjusting temperature parameter for more consistent output

#### 5. 🏛️ Database Schema Issues
- ✅ Column names are case-sensitive (`Interview_report` with capital I)
- ✅ Use the provided test scripts to verify schema compatibility
- ✅ Check that JSONB columns are properly configured

### 📊 Test Your Setup

```bash
# Test database schema compatibility
python test_db_schema.py

# Test complete evaluation process
python run_evaluation_example.py

# Interactive testing with custom session ID
python run_interactive.py
```

### 📝 Logging

The module provides comprehensive logging. View detailed logs during execution:

```python
import logging
logging.basicConfig(level=logging.DEBUG)  # For detailed debugging
logging.basicConfig(level=logging.INFO)   # For general information (default)
logging.basicConfig(level=logging.ERROR)  # For errors only
```

## ⚡ Performance Considerations

- **⏱️ Evaluation Time**: Llama3 analysis typically takes 60-90 seconds per interview
- **🔄 Batch Processing**: For multiple interviews, use the batch processing feature
- **💾 Memory Usage**: Each evaluation loads conversation data into memory
- **🌐 Network**: Ensure stable connection to both Ollama and Supabase
- **🔥 Ollama Performance**: Consider GPU acceleration for faster model inference

## 🎯 Best Practices

### For Optimal Results:
1. **📋 Quality Data**: Ensure interview conversations are complete and well-formatted
2. **📝 Job Descriptions**: Provide detailed, accurate job descriptions for context
3. **⏳ Patience**: Allow sufficient time for AI analysis (60-90 seconds per interview)
4. **🔍 Review Results**: AI evaluations should complement, not replace, human judgment
5. **🔄 Batch Processing**: Use batch mode for evaluating multiple interviews efficiently

### Data Quality Guidelines:
- ✅ Conversations should have clear role assignments (user/assistant)
- ✅ Include meaningful exchanges (avoid very short responses)
- ✅ Ensure proper formatting in the `session_information` field
- ✅ Job descriptions should be comprehensive and role-specific

## 📚 Additional Resources

- **[Ollama Documentation](https://ollama.ai/docs)** - For Ollama setup and configuration
- **[Supabase Documentation](https://supabase.com/docs)** - For database setup and management
- **[Llama3 Model Info](https://ollama.ai/library/llama3)** - For model-specific details

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Run the provided test scripts to diagnose issues
3. Review the logs for detailed error information
4. Ensure all prerequisites are properly installed and configured

## 📄 License

This module is part of the Project Polaris interview platform.

---

**🚀 Ready to get started?** Run `python run_evaluation_example.py` to test your setup!
