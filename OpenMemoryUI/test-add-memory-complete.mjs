import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testAddMemory() {
  console.log('Starting comprehensive add memory test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'log') {
      console.log(`CONSOLE [${msg.type()}]:`, msg.text());
    }
  });
  
  try {
    console.log('1. Navigating to localhost:3002...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for backend connection
    
    console.log('2. Taking initial screenshot...');
    await page.screenshot({ 
      path: join(__dirname, 'add-memory-01-initial.png'),
      fullPage: true 
    });
    
    // Check if connected
    const connectedText = await page.locator('text=Connected').count();
    console.log(`Connected status visible: ${connectedText > 0 ? 'YES' : 'NO'}`);
    
    console.log('3. Clicking Add Memory button...');
    const addButton = page.locator('button:has-text("Add Memory")').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: join(__dirname, 'add-memory-02-modal-opened.png'),
      fullPage: true 
    });
    
    // Check if modal is visible
    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]');
    const captureMemoryText = page.locator('text=Capture Your Memory');
    const modalVisible = await modal.count() + await captureMemoryText.count();
    console.log(`Modal visible: ${modalVisible > 0 ? 'YES' : 'NO'}`);
    
    if (modalVisible > 0) {
      console.log('4. Filling in memory form...');
      
      // Look for textarea for memory content
      const contentTextarea = page.locator('textarea').first();
      if (await contentTextarea.count() > 0) {
        await contentTextarea.fill('This is a test memory to verify that the OpenMemory UI can successfully connect to the backend and save memories. The IC Agent implementation is working correctly and can communicate with the canister.');
        
        console.log('5. Taking screenshot with content filled...');
        await page.screenshot({ 
          path: join(__dirname, 'add-memory-03-content-filled.png'),
          fullPage: true 
        });
        
        // Look for save button
        const saveButton = page.locator('button:has-text("Save Memory"), button:has-text("Save"), button:has-text("Add")');
        if (await saveButton.count() > 0) {
          console.log('6. Clicking Save Memory button...');
          await saveButton.first().click();
          
          // Wait for the submission to complete
          await page.waitForTimeout(5000);
          
          console.log('7. Taking screenshot after submission...');
          await page.screenshot({ 
            path: join(__dirname, 'add-memory-04-after-submission.png'),
            fullPage: true 
          });
          
          // Check for success/error messages
          const successMessage = await page.locator('text=success, text=saved, text=added, [class*="success"], [class*="toast"]').count();
          const errorMessage = await page.locator('text=error, text=failed, [class*="error"]').count();
          
          console.log(`Success message found: ${successMessage > 0 ? 'YES' : 'NO'}`);
          console.log(`Error message found: ${errorMessage > 0 ? 'YES' : 'NO'}`);
          
          // Check if memory count increased
          console.log('8. Checking if memory count updated...');
          await page.waitForTimeout(2000);
          
          const memoryCountElement = page.locator('text=Memories').locator('..').locator('text=0, text=1, text=2, text=3, text=4, text=5, text=6, text=7, text=8, text=9');
          const memoryCount = await memoryCountElement.textContent();
          console.log(`Memory count: ${memoryCount || 'not found'}`);
          
        } else {
          console.log('No save button found');
        }
      } else {
        console.log('No textarea found for content');
      }
    } else {
      console.log('Modal did not open');
    }
    
    console.log('9. Final screenshot...');
    await page.screenshot({ 
      path: join(__dirname, 'add-memory-05-final.png'),
      fullPage: true 
    });
    
    console.log('Add memory test completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ 
      path: join(__dirname, 'add-memory-error.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

testAddMemory().catch(console.error);