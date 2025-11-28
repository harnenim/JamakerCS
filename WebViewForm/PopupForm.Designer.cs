namespace WebViewForm
{
    partial class PopupForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
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
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            mainView = new Microsoft.Web.WebView2.WinForms.WebView2();
            ((System.ComponentModel.ISupportInitialize)mainView).BeginInit();
            SuspendLayout();
            // 
            // mainView
            // 
            mainView.AllowExternalDrop = false;
            mainView.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            mainView.CreationProperties = null;
            mainView.DefaultBackgroundColor = Color.White;
            mainView.Location = new Point(0, 0);
            mainView.Margin = new Padding(0);
            mainView.Name = "mainView";
            mainView.Size = new Size(400, 211);
            mainView.TabIndex = 0;
            mainView.ZoomFactor = 1D;
            // 
            // PopupForm
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(400, 211);
            Controls.Add(mainView);
            Margin = new Padding(2, 1, 2, 1);
            Name = "PopupForm";
            ShowIcon = false;
            Text = "Popup";
            ((System.ComponentModel.ISupportInitialize)mainView).EndInit();
            ResumeLayout(false);
        }

        #endregion

        public Microsoft.Web.WebView2.WinForms.WebView2 mainView;
    }
}