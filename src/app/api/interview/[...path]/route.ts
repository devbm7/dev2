import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = 'https://your-fastapi-server.railway.app'; // Replace with your actual FastAPI server URL

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = '/' + params.path.join('/');
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const fullPath = searchParams ? `${path}?${searchParams}` : path;
    
    const response = await fetch(`${FASTAPI_BASE_URL}${fullPath}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries()),
      },
    });

    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const data = await response.text();
      return new NextResponse(data, { 
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'text/plain',
        }
      });
    }
  } catch (error) {
    console.error('Error proxying to FastAPI:', error);
    return NextResponse.json(
      { error: 'Failed to connect to interview server' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = '/' + params.path.join('/');
    const contentType = request.headers.get('content-type') || '';
    
    let body: any;
    if (contentType.includes('multipart/form-data')) {
      body = await request.formData();
    } else if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      body = await request.text();
    }
    
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        ...Object.fromEntries(request.headers.entries()),
      },
    };

    if (contentType.includes('multipart/form-data')) {
      fetchOptions.body = body;
    } else if (contentType.includes('application/json')) {
      fetchOptions.body = JSON.stringify(body);
    } else {
      fetchOptions.body = body;
    }
    
    const response = await fetch(`${FASTAPI_BASE_URL}${path}`, fetchOptions);

    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const data = await response.text();
      return new NextResponse(data, { 
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'text/plain',
        }
      });
    }
  } catch (error) {
    console.error('Error proxying to FastAPI:', error);
    return NextResponse.json(
      { error: 'Failed to connect to interview server' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = '/' + params.path.join('/');
    const body = await request.json();
    
    const response = await fetch(`${FASTAPI_BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries()),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying to FastAPI:', error);
    return NextResponse.json(
      { error: 'Failed to connect to interview server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = '/' + params.path.join('/');
    
    const response = await fetch(`${FASTAPI_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries()),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying to FastAPI:', error);
    return NextResponse.json(
      { error: 'Failed to connect to interview server' },
      { status: 500 }
    );
  }
}
