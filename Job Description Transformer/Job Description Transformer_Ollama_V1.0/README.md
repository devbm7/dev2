# Intelligent Job Description Parser v1.2

An advanced Python application that intelligently extracts job information using Llama3 AI and integrates with Supabase database for automated job profile generation. This enhanced version features field-specific extraction, aggressive response cleaning, and seamless database integration.

## Overview

This intelligent parser system automatically processes job descriptions from a Supabase database, uses targeted AI prompts to extract specific information for each JSON template field, and saves the structured results back to the database. It's designed for production use in recruitment platforms and interview management systems.

## Key Features

### 🤖 **Intelligent Field-Specific Extraction**
- **Targeted Prompts**: Custom AI prompts for each field type (title, skills, experience, etc.)
- **Enhanced Accuracy**: Field-specific extraction logic for better categorization
- **Smart Classification**: Automatically separates technical vs soft skills

### 🧹 **Advanced Response Cleaning**
- **Verbose Text Removal**: Removes AI explanations and field descriptions
- **Pattern Recognition**: Uses regex to clean common AI response patterns
- **Clean Output**: Ensures concise, professional extracted content

### 🗄️ **Supabase Database Integration**
- **Automatic Processing**: Fetches job descriptions from database
- **Smart Updates**: Saves structured JSON to `initial_json_schema` column
- **Verification System**: Confirms successful database updates
- **Batch Processing**: Handles multiple pending jobs

### 🎯 **Complete Template Preservation**
- **Structure Integrity**: Maintains all original JSON template fields
- **Default Handling**: Intelligent "OPEN" value assignment for missing data
- **Nested Field Support**: Properly handles complex nested structures

### 🔧 **Production-Ready Features**
- **Connection Testing**: Validates both Llama3 and Supabase connections
- **Error Recovery**: Graceful handling of API failures and timeouts
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Local Backup**: Optional local file storage for processed templates

## What It Extracts

The intelligent parser uses field-specific prompts to extract and categorize information with high accuracy:

### Core Details
- **Job Title**: Extracted using title-specific prompts
- **Job Summary**: Concise 1-2 sentence descriptions with cleaned formatting
- **Employment Type**: Agreement type (employee/contractor), schedule (full/part-time), term (permanent/temporary)
- **Location**: Work type (remote/onsite/hybrid) and geographic requirements

### Responsibilities
- **Key Objectives**: Goals and targets with structured format
- **Day-to-Day Duties**: Specific tasks and responsibilities

### Qualifications
- **Technical Skills**: Programming languages, frameworks, tools, and technologies
- **Soft Skills**: Communication, teamwork, leadership, and interpersonal abilities
- **Experience**: Required years and detailed experience descriptions
- **Education**: Degree requirements and experience substitution policies

### Company Context
- **Culture**: Company values and work environment
- **Growth Opportunities**: Career development and advancement paths

### Compensation
- **Salary Range**: Minimum and maximum compensation with currency
- **Benefits**: Insurance, PTO, retirement plans, and perks

### Interview Framework
- **Assessment Plans**: Competency-based evaluation methods
- **Interview Flow**: Multi-stage interview process structure

## Prerequisites

### Required Software
1. **Python 3.7+** with required packages
2. **Ollama** - Local AI model runner
3. **Llama3 Model** - The AI model for intelligent text processing
4. **Supabase Account** - Cloud database for job templates

### Installation Steps

1. **Install Ollama**:
   - Download from [https://ollama.ai](https://ollama.ai)
   - Follow installation instructions for your OS

2. **Install Llama3**:
   ```bash
   ollama pull llama3
   ```

3. **Start Ollama Server**:
   ```bash
   ollama serve
   ```

4. **Install Python Dependencies**:
   ```bash
   pip install requests supabase python-dotenv
   ```

5. **Configure Supabase**:
   - Set up environment variables (see Configuration section)
   - Ensure `job_templates` table exists with required columns

## File Structure

```
Job Transformer/
├── Job_Transformer_Intelligent_v2.0.py    # Main intelligent parser
├── Job_Transformer_Supabase_v1.2.py       # Legacy Supabase version
├── Job_Transformer_Ollama_v1.1.py         # Legacy local version
├── JSON_Template/
│   └── json_template.json                  # Complete template structure
├── Output/                                 # Local backup files
│   └── {template_id}_intelligent.json     # Processed templates
├── supabase/
│   └── config.py                          # Database configuration
├── requirements.txt                        # Python dependencies
├── README.md                              # This file
└── README_Supabase.md                     # Database setup guide
```

## Usage

### Option 1: Process Latest Unprocessed Job
```bash
python Job_Transformer_Intelligent_v2.0.py
# Select option 2 for latest job
```

### Option 2: Process Specific Job by Template ID
```bash
python Job_Transformer_Intelligent_v2.0.py
# Select option 1 and enter template ID
```

### Option 3: Process All Pending Jobs
```bash
python Job_Transformer_Intelligent_v2.0.py
# Select option 3 for batch processing
```

## Interactive Menu

When you run the script, you'll see:

```
=== Intelligent Supabase Job Description Parser ===
1. Process specific job by Template ID (Intelligent)
2. Process latest unprocessed job (Intelligent)
3. Process all pending jobs (Intelligent)
4. Exit

Enter your choice (1-4):
```

## Example Processing Output

```
=== Intelligent Job Description Parser ===
Testing connections...
✓ Llama3 connection successful
✓ Supabase connection successful

Processing Job Intelligently:
  Template ID: 123e4567-e89b-12d3-a456-426614174000
  Template Name: Senior Developer Position
  Job Role: Software Engineer
  Job Description Length: 1247 characters
  Job Description Content: We are seeking a skilled Software Developer to join our dynamic team...

Starting intelligent field extraction...
Extracting information for: jobProfile.coreDetails.title
  jobProfile.coreDetails.title: Software Developer Position
Extracting information for: jobProfile.coreDetails.jobSummary
  jobProfile.coreDetails.jobSummary: Join our dynamic team to develop innovative software solutions.
Extracting information for: jobProfile.qualifications.skills.technical
  jobProfile.qualifications.skills.technical: ["Python", "JavaScript", "React", "SQL"]
Extracting information for: jobProfile.qualifications.skills.soft
  jobProfile.qualifications.skills.soft: ["Good communication", "Team collaboration"]

✓ Successfully updated initial_json_schema for template ID: 123e4567-e89b-12d3-a456-426614174000
✓ Database verification successful - initial_json_schema is populated
✓ Database successfully updated for template 123e4567-e89b-12d3-a456-426614174000

=== Intelligent Processing Complete ===
Template ID: 123e4567-e89b-12d3-a456-426614174000
Job Title: Software Developer Position
Intelligently filled JSON saved to initial_json_schema column!
All unmapped fields marked as 'OPEN'
```

## Output Format

The script generates a comprehensive JSON file with the following structure:

```json
{
  "jobProfile": {
    "JobId": "job-20250807184821",
    "coreDetails": {
      "title": "Senior Software Engineer",
      "jobSummary": "...",
      "employmentType": { ... },
      "jobLocation": { ... }
    },
    "responsibilities": { ... },
    "qualifications": { ... },
    "companyContext": { ... },
    "compensation": { ... },
    "interviewGuidance": { ... },
    "meta": { ... }
  }
}
```

## Configuration

### Supabase Environment Variables

Create a `.env` file or set environment variables:

```bash
# Primary configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Alternative configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Fallback Configuration

The script includes fallback values for development:
- URL: `https://ibnsjeoemngngkqnnjdz.supabase.co`
- Service Role Key: Built-in development key

### Database Schema Requirements

Ensure your `job_templates` table has these columns:
- `template_id` (UUID, primary key)
- `user_job_description` (TEXT)
- `initial_json_schema` (JSONB)
- `template_name` (TEXT)
- `job_role` (TEXT)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)

### Llama3 API Settings

Default configuration connects to `http://localhost:11434`. Modify if needed:

```python
parser = IntelligentJobDescriptionParser(
    llama_api_url="http://your-custom-url:port/api/generate"
)
```

## Troubleshooting

### Connection Issues

1. **"Cannot connect to Llama3 API"**
   - Ensure Ollama is running: `ollama serve`
   - Check if Llama3 is installed: `ollama list`
   - Install if missing: `ollama pull llama3`
   - Verify port 11434 is available

2. **"Cannot connect to Supabase database"**
   - Verify environment variables are set correctly
   - Check Supabase URL and API keys
   - Ensure `job_templates` table exists
   - Confirm database permissions

3. **"No job description found in database"**
   - Check that unprocessed jobs exist (`initial_json_schema` is null)
   - Verify `is_active` is set to true
   - Ensure `user_job_description` column has content

### Processing Issues

4. **"Template ID not found in database"**
   - Verify the UUID format is correct
   - Check that the template_id exists in the database
   - Ensure the job hasn't been deleted

5. **"Error calling Llama3 API: Read timed out"**
   - Large job descriptions may take longer to process
   - Increase timeout in the script if needed
   - The script will fall back to "OPEN" values for timeouts

6. **"Update operation returned no data"**
   - Check database write permissions
   - Verify the Supabase service role key has proper access
   - Ensure the initial_json_schema column accepts JSONB data

### Data Quality Issues

7. **"Verbose AI responses not cleaned properly"**
   - The response cleaning system should remove explanatory text
   - Check if new AI response patterns need to be added to clean_response()
   - Verify field-specific prompts are working correctly

8. **"Skills not properly categorized"**
   - Technical skills should include programming languages and tools
   - Soft skills should include communication and interpersonal abilities
   - Check the field-specific extraction prompts

### Debug Mode

For detailed debugging, modify the logging level:

```python
logging.basicConfig(level=logging.DEBUG)
```

### Verification Steps

After processing, verify:
1. Database update confirmation message appears
2. `initial_json_schema` column is populated
3. All template fields are preserved
4. Missing data is marked as "OPEN"
5. Local backup file is created (if enabled)

## Advanced Features

### Field-Specific Extraction Logic

The intelligent parser uses targeted prompts for different field types:

- **Title Extraction**: Looks for job titles at the beginning or in headers
- **Summary Extraction**: Creates concise 1-2 sentence summaries
- **Technical Skills**: Identifies programming languages, frameworks, and tools
- **Soft Skills**: Extracts communication, teamwork, and interpersonal abilities
- **Experience**: Finds required years and background descriptions
- **Salary Information**: Parses compensation ranges and currency

### Response Cleaning System

Advanced regex patterns remove:
- AI explanation text and field descriptions
- Verbose response patterns
- Parenthetical explanations
- Field references and meta-commentary
- Template descriptions that leak through

### Template Structure Preservation

The system ensures:
- All original JSON fields are maintained
- Nested structures remain intact
- Default values are intelligently assigned
- Missing data is consistently marked as "OPEN"
- Custom fields and arrays are properly handled

### Database Integration Features

- **Smart Updates**: Only updates when new data is available
- **Verification System**: Confirms successful database writes
- **Batch Processing**: Handles multiple jobs efficiently
- **Error Recovery**: Graceful handling of database connection issues
- **Local Backup**: Optional file storage for processed templates

## API Reference

### Main Classes

#### `IntelligentJobDescriptionParser`

```python
parser = IntelligentJobDescriptionParser(llama_api_url="http://localhost:11434/api/generate")
```

**Key Methods:**
- `process_job_description_intelligently(template_id=None)` - Main processing method
- `test_llama_connection()` - Verify AI model connectivity  
- `test_supabase_connection()` - Verify database connectivity
- `extract_field_specific_info(job_description, field_path, field_config)` - Field-specific extraction
- `clean_response(response, field_path)` - Remove verbose AI text
- `save_initial_json_to_db(template_id, initial_json)` - Save to database
- `verify_database_update(template_id)` - Confirm successful updates

### Processing Functions

```python
# Process single job
process_single_job_intelligently(template_id=None)

# Process all pending jobs
process_all_pending_jobs_intelligently()
```

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Install development dependencies: `pip install -r requirements.txt`
4. Set up test environment variables
5. Make your changes with comprehensive testing
6. Update documentation if needed
7. Submit a pull request

### Testing Guidelines

- Test with various job description formats
- Verify database integration works correctly
- Ensure field-specific extraction is accurate
- Test error handling and recovery
- Validate template structure preservation

## Dependencies

### Production Dependencies
- `requests` - HTTP client for Llama3 API calls
- `supabase` - Supabase Python client for database operations
- `python-dotenv` - Environment variable management (optional)

### Built-in Python Modules
- `json` - JSON parsing and manipulation
- `re` - Regular expressions for response cleaning
- `os` - Operating system interface and environment variables
- `logging` - Comprehensive logging functionality
- `datetime` - Timestamp generation and handling
- `typing` - Type hints for better code documentation

## Version History

### v2.0 (Current) - Intelligent Processing
- ✅ Field-specific extraction with targeted prompts
- ✅ Advanced response cleaning and pattern removal
- ✅ Complete Supabase database integration
- ✅ Template structure preservation
- ✅ Batch processing capabilities
- ✅ Verification and error recovery systems

### v1.2 - Supabase Integration
- ✅ Basic database connectivity
- ✅ Simple field extraction
- ✅ Initial JSON template handling

### v1.1 - Ollama Integration  
- ✅ Local Llama3 model integration
- ✅ Basic job description parsing
- ✅ File-based input/output

## License

This project is part of the Project-Polaris interview platform system.

## Support

For issues or questions:

1. **Check Troubleshooting Section**: Review common issues and solutions above
2. **Verify Prerequisites**: Ensure all dependencies are properly installed
3. **Test Connections**: Use built-in connection testing features
4. **Enable Debug Logging**: Set logging level to DEBUG for detailed output
5. **Create Repository Issue**: Submit detailed bug reports with logs

### Useful Commands

```bash
# Test Ollama/Llama3 setup
ollama list
ollama serve

# Test Python dependencies
pip list | grep -E "(requests|supabase)"

# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```
