$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('D:\app\stepcount\Gujarat_App_Development_Prompt (1).docx')
$text = $doc.Content.Text
$doc.Close()
$word.Quit()
$text
