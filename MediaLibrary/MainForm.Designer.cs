namespace MovieLog
{
    partial class MainForm
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            mainView = new Microsoft.Web.WebView2.WinForms.WebView2();
            ((System.ComponentModel.ISupportInitialize)mainView).BeginInit();
            SuspendLayout();
            // 
            // mainView
            // 
            mainView.AllowExternalDrop = true;
            mainView.CreationProperties = null;
            mainView.DefaultBackgroundColor = Color.White;
            mainView.Dock = DockStyle.Fill;
            mainView.Location = new Point(0, 0);
            mainView.Margin = new Padding(0);
            mainView.Name = "mainView";
            mainView.Size = new Size(1008, 729);
            mainView.TabIndex = 0;
            mainView.ZoomFactor = 1D;
            // 
            // MainForm
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(1008, 729);
            Controls.Add(mainView);
            Name = "MainForm";
            Text = "미디어 라이브러리";
            ((System.ComponentModel.ISupportInitialize)mainView).EndInit();
            ResumeLayout(false);
        }

        #endregion

        private Microsoft.Web.WebView2.WinForms.WebView2 mainView;
    }
}