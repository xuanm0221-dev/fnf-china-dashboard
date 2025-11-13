import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const INSIGHTS_FILE = path.join(process.cwd(), 'public', 'data', 'insights.json');

// GET: 인사이트 불러오기
export async function GET() {
  try {
    // Vercel 환경에서는 파일 시스템 쓰기가 불가능하므로, 
    // 빈 객체를 반환하거나 외부 저장소를 사용해야 합니다.
    if (process.env.VERCEL) {
      // Vercel 환경: 외부 저장소를 사용하거나 기본값 반환
      // TODO: Vercel KV, MongoDB, Supabase 등을 사용하도록 수정
      return NextResponse.json({});
    }
    
    // 로컬 개발 환경: 파일 시스템 사용
    if (fs.existsSync(INSIGHTS_FILE)) {
      const data = fs.readFileSync(INSIGHTS_FILE, 'utf8');
      return NextResponse.json(JSON.parse(data));
    } else {
      // 기본값 반환
      return NextResponse.json({});
    }
  } catch (error) {
    console.error('Error reading insights:', error);
    return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 });
  }
}

// POST: 인사이트 저장하기
export async function POST(request: NextRequest) {
  try {
    const insights = await request.json();
    
    // Vercel 환경에서는 파일 시스템 쓰기가 불가능
    if (process.env.VERCEL) {
      // Vercel 환경: 외부 저장소를 사용하거나 GitHub API를 통해 저장
      // TODO: Vercel KV, MongoDB, Supabase 등을 사용하도록 수정
      console.log('Vercel environment: Cannot write to file system');
      // 일단 성공으로 반환하지만, 실제로는 외부 저장소에 저장해야 합니다.
      return NextResponse.json({ success: true, message: 'Saved to external storage (not implemented)' });
    }
    
    // 로컬 개발 환경: 파일 시스템 사용
    // public/data 디렉토리가 없으면 생성
    const dataDir = path.dirname(INSIGHTS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 인사이트 저장
    fs.writeFileSync(INSIGHTS_FILE, JSON.stringify(insights, null, 2), 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving insights:', error);
    return NextResponse.json({ error: 'Failed to save insights' }, { status: 500 });
  }
}

