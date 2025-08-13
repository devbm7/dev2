import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/interview', '');
    
    const response = await fetch(`${FASTAPI_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to FastAPI:', error);
    return NextResponse.json(
      { error: 'Failed to connect to interview server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/interview', '');
    const body = await request.json();
    
    const response = await fetch(`${FASTAPI_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to FastAPI:', error);
    return NextResponse.json(
      { error: 'Failed to connect to interview server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/interview', '');
    const body = await request.json();
    
    const response = await fetch(`${FASTAPI_BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to FastAPI:', error);
    return NextResponse.json(
      { error: 'Failed to connect to interview server' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/interview', '');
    
    const response = await fetch(`${FASTAPI_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to FastAPI:', error);
    return NextResponse.json(
      { error: 'Failed to connect to interview server' },
      { status: 500 }
    );
  }
}
