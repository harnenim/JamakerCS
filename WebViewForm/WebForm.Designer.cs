using Microsoft.Web.WebView2.WinForms;
using Timer = System.Windows.Forms.Timer;

namespace WebViewForm
{
    partial class WebForm
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
            components = new System.ComponentModel.Container();
            layerForDrag = new TransparentPanel();
            timer = new Timer(components);
            mainView = new WebView2();
            ((System.ComponentModel.ISupportInitialize)mainView).BeginInit();
            SuspendLayout();
            // 
            // layerForDrag
            // 
            layerForDrag.AllowDrop = true;
            layerForDrag.BackColor = SystemColors.ActiveCaption;
            layerForDrag.Dock = DockStyle.Fill;
            layerForDrag.Location = new Point(0, 0);
            layerForDrag.Name = "layerForDrag";
            layerForDrag.Size = new Size(800, 450);
            layerForDrag.TabIndex = 7;
            layerForDrag.Visible = false;
            layerForDrag.DragDrop += DragDropMain;
            layerForDrag.DragOver += DragOverMain;
            layerForDrag.DragLeave += DragLeaveMain;
            layerForDrag.MouseClick += ClickLayerForDrag;
            // 
            // mainView
            // 
            mainView.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            mainView.Location = new Point(0, 0);
            mainView.Margin = new Padding(0);
            mainView.Name = "mainView";
            mainView.Size = new Size(800, 450);
            mainView.TabIndex = 0;
            mainView.ZoomFactor = 1D;
            // 
            // WebForm
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(800, 450);
            Controls.Add(layerForDrag);
            Controls.Add(mainView);
            Name = "WebForm";
            ((System.ComponentModel.ISupportInitialize)mainView).EndInit();
            ResumeLayout(false);
        }

        #endregion

        protected WebView2 mainView;
        protected TransparentPanel layerForDrag;
        protected Timer timer;
    }
}